import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import get_db
from models import Booking

_base_dir = "/data" if os.path.isdir("/data") else os.path.join(os.path.dirname(__file__), "..")
UPLOADS_DIR = os.path.join(_base_dir, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

router = APIRouter()

ADMIN_TOKEN = "nnp-admin-secure-2026"


# ── helpers ──────────────────────────────────────────────────────────────────

def _gen_ref():
    date_part = datetime.now().strftime("%Y%m%d")
    rand = str(uuid.uuid4().int)[:4]
    return f"NNP-{date_part}-{rand}"


def require_admin(authorization: str = Header(None)):
    if not authorization or authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


def booking_to_dict(b: Booking) -> dict:
    return {
        "id": b.id,
        "referenceNumber": b.referenceNumber,
        "courtId": b.courtId,
        "courtName": b.courtName,
        "date": b.date,
        "timeStart": b.timeStart,
        "timeEnd": b.timeEnd,
        "duration": b.duration,
        "pricePerHour": b.pricePerHour,
        "totalAmount": b.totalAmount,
        "customerName": b.customerName,
        "customerEmail": b.customerEmail,
        "customerPhone": b.customerPhone,
        "paymentMethod": b.paymentMethod,
        "gcashReference": b.gcashReference,
        "screenshotPath": b.screenshotPath,
        "notes": b.notes,
        "status": b.status,
        "createdAt": b.createdAt,
        "updatedAt": b.updatedAt,
    }


# ── schemas ──────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    courtId: str
    courtName: str
    date: str
    timeStart: str
    duration: int
    pricePerHour: int
    totalAmount: int
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = ""
    paymentMethod: str
    gcashReference: Optional[str] = ""
    notes: Optional[str] = ""


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    gcashReference: Optional[str] = None
    notes: Optional[str] = None


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/availability")
def get_availability(courtId: str, date: str, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(
        Booking.courtId == courtId,
        Booking.date == date,
        Booking.status != "cancelled"
    ).all()
    booked = set()
    for b in bookings:
        start = int(b.timeStart.split(":")[0])
        for i in range(b.duration):
            booked.add(start + i)
    return {"bookedSlots": list(booked)}


@router.get("/")
def list_bookings(admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.createdAt.desc()).all()
    return [booking_to_dict(b) for b in bookings]


@router.post("/")
def create_booking(body: BookingCreate, db: Session = Depends(get_db)):
    start_hour = int(body.timeStart.split(":")[0])
    wanted = set(start_hour + i for i in range(body.duration))

    conflicts = db.query(Booking).filter(
        Booking.courtId == body.courtId,
        Booking.date == body.date,
        Booking.status != "cancelled"
    ).all()

    for b in conflicts:
        b_start = int(b.timeStart.split(":")[0])
        b_slots = set(b_start + i for i in range(b.duration))
        if wanted & b_slots:
            raise HTTPException(status_code=409, detail="This time slot is already booked.")

    end_hour = start_hour + body.duration
    time_end = f"{str(end_hour).zfill(2)}:00"
    status = "pending_cash" if body.paymentMethod == "cash" else "pending"

    booking = Booking(
        id=str(uuid.uuid4()),
        referenceNumber=_gen_ref(),
        courtId=body.courtId,
        courtName=body.courtName,
        date=body.date,
        timeStart=body.timeStart,
        timeEnd=time_end,
        duration=body.duration,
        pricePerHour=body.pricePerHour,
        totalAmount=body.totalAmount,
        customerName=body.customerName,
        customerEmail=body.customerEmail or "",
        customerPhone=body.customerPhone,
        paymentMethod=body.paymentMethod,
        gcashReference=body.gcashReference or "",
        notes=body.notes or "",
        status=status,
        createdAt=datetime.now().isoformat(),
        updatedAt=None,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking_to_dict(booking)


@router.get("/{booking_id}")
def get_booking(booking_id: str, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_to_dict(b)


@router.put("/{booking_id}")
def update_booking(booking_id: str, body: BookingUpdate, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    if body.status is not None:
        b.status = body.status
    if body.gcashReference is not None:
        b.gcashReference = body.gcashReference
    if body.notes is not None:
        b.notes = body.notes
    b.updatedAt = datetime.now().isoformat()

    db.commit()
    db.refresh(b)
    return booking_to_dict(b)


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    b.status = "cancelled"
    b.updatedAt = datetime.now().isoformat()
    db.commit()
    return {"message": "Booking cancelled"}


@router.post("/{booking_id}/screenshot")
async def upload_screenshot(booking_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    ext = os.path.splitext(file.filename or "screenshot.jpg")[1] or ".jpg"
    filename = f"{booking_id}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    b.screenshotPath = f"/uploads/{filename}"
    b.updatedAt = datetime.now().isoformat()
    db.commit()

    return {"screenshotPath": f"/uploads/{filename}"}

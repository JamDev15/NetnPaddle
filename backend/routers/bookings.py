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
from routers.settings import bookings_are_open, _get_setting, CLOSED_MESSAGE_KEY, hour_closed_reason

router = APIRouter()

ADMIN_TOKEN = "nnp-admin-secure-2026"

# Bookings in these statuses no longer occupy their time slot
FREED_STATUSES = ("cancelled", "completed")

# ₱200/hr up to and including the 5-6pm slot, ₱250/hr from 6pm onwards
RATE_BEFORE_6PM = 200
RATE_FROM_6PM = 250


def hourly_rate(hour: int) -> int:
    return RATE_BEFORE_6PM if (hour % 24) < 18 else RATE_FROM_6PM


def compute_total(start_hour: int, duration: int) -> int:
    return sum(hourly_rate(start_hour + i) for i in range(duration))

# uploads fallback (local dev without Drive configured)
_base_dir = "/data" if os.path.isdir("/data") else os.path.join(os.path.dirname(__file__), "..")
UPLOADS_DIR = os.path.join(_base_dir, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


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
        "id": b.id, "referenceNumber": b.referenceNumber,
        "courtId": b.courtId, "courtName": b.courtName,
        "date": b.date, "timeStart": b.timeStart, "timeEnd": b.timeEnd,
        "duration": b.duration, "pricePerHour": b.pricePerHour, "totalAmount": b.totalAmount,
        "customerName": b.customerName, "customerEmail": b.customerEmail,
        "customerPhone": b.customerPhone, "paymentMethod": b.paymentMethod,
        "gcashReference": b.gcashReference, "screenshotPath": b.screenshotPath,
        "notes": b.notes, "status": b.status,
        "createdAt": b.createdAt, "updatedAt": b.updatedAt,
    }


def _save_screenshot(content: bytes, filename: str, mime: str) -> str:
    """Upload to Supabase Storage if configured, otherwise save locally."""
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if supabase_url and supabase_key:
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{supabase_url}/storage/v1/object/screenshots/{filename}",
                data=content,
                method="POST",
                headers={
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": mime,
                    "x-upsert": "true",
                }
            )
            urllib.request.urlopen(req)
            return f"{supabase_url}/storage/v1/object/public/screenshots/{filename}"
        except Exception as e:
            print(f"Supabase upload failed, falling back to local: {e}")

    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{filename}"


# ── schemas ──────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    courtId: str
    courtName: str
    date: str
    timeStart: str
    duration: int
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
    date: Optional[str] = None
    timeStart: Optional[str] = None
    duration: Optional[int] = None
    courtId: Optional[str] = None
    courtName: Optional[str] = None


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/availability")
def get_availability(courtId: str, date: str, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(
        Booking.courtId == courtId,
        Booking.date == date,
        Booking.status.notin_(FREED_STATUSES)
    ).all()
    booked = set()
    for b in bookings:
        start = int(b.timeStart.split(":")[0])
        for i in range(b.duration):
            booked.add(start + i)
    return {"bookedSlots": list(booked)}


@router.get("/")
def list_bookings(admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    return [booking_to_dict(b) for b in db.query(Booking).order_by(Booking.createdAt.desc()).all()]


@router.post("/")
def create_booking(body: BookingCreate, db: Session = Depends(get_db)):
    if not bookings_are_open(db):
        message = _get_setting(db, CLOSED_MESSAGE_KEY, "") or "Bookings are temporarily closed. Please check back later."
        raise HTTPException(status_code=403, detail=message)

    start_hour = int(body.timeStart.split(":")[0])
    wanted = set(start_hour + i for i in range(body.duration))

    for h in wanted:
        closed_reason = hour_closed_reason(db, body.date, h)
        if closed_reason:
            raise HTTPException(status_code=403, detail=closed_reason)

    for b in db.query(Booking).filter(
        Booking.courtId == body.courtId,
        Booking.date == body.date,
        Booking.status.notin_(FREED_STATUSES)
    ).all():
        b_start = int(b.timeStart.split(":")[0])
        if wanted & set(b_start + i for i in range(b.duration)):
            raise HTTPException(status_code=409, detail="This time slot is already booked.")

    total_amount = compute_total(start_hour, body.duration)
    price_per_hour = total_amount // body.duration

    booking = Booking(
        id=str(uuid.uuid4()),
        referenceNumber=_gen_ref(),
        courtId=body.courtId, courtName=body.courtName,
        date=body.date, timeStart=body.timeStart,
        timeEnd=f"{str(start_hour + body.duration).zfill(2)}:00",
        duration=body.duration, pricePerHour=price_per_hour, totalAmount=total_amount,
        customerName=body.customerName, customerEmail=body.customerEmail or "",
        customerPhone=body.customerPhone, paymentMethod=body.paymentMethod,
        gcashReference=body.gcashReference or "", notes=body.notes or "",
        status="pending", createdAt=datetime.now().isoformat(), updatedAt=None,
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
    if body.status is not None: b.status = body.status
    if body.gcashReference is not None: b.gcashReference = body.gcashReference
    if body.notes is not None: b.notes = body.notes

    # Reschedule fields
    new_date = body.date or b.date
    new_time = body.timeStart or b.timeStart
    new_duration = body.duration or b.duration
    new_court = body.courtId or b.courtId

    if body.date or body.timeStart or body.duration or body.courtId:
        start_hour = int(new_time.split(":")[0])
        wanted = set(start_hour + i for i in range(new_duration))
        for other in db.query(Booking).filter(
            Booking.courtId == new_court,
            Booking.date == new_date,
            Booking.status.notin_(FREED_STATUSES),
            Booking.id != booking_id,
        ).all():
            o_start = int(other.timeStart.split(":")[0])
            if wanted & set(o_start + i for i in range(other.duration)):
                raise HTTPException(status_code=409, detail="That time slot is already booked.")
        b.date = new_date
        b.timeStart = new_time
        b.duration = new_duration
        b.timeEnd = f"{str(start_hour + new_duration).zfill(2)}:00"
        b.totalAmount = compute_total(start_hour, new_duration)
        b.pricePerHour = b.totalAmount // new_duration
        if body.courtId: b.courtId = body.courtId
        if body.courtName: b.courtName = body.courtName

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


@router.delete("/{booking_id}/permanent")
def delete_booking(booking_id: str, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(b)
    db.commit()
    return {"message": "Booking permanently deleted"}


@router.post("/{booking_id}/screenshot")
async def upload_booking_screenshot(booking_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    content = await file.read()
    mime = file.content_type or "image/jpeg"
    ext = os.path.splitext(file.filename or "screenshot.jpg")[1] or ".jpg"
    url = _save_screenshot(content, f"{booking_id}{ext}", mime)

    b.screenshotPath = url
    b.updatedAt = datetime.now().isoformat()
    db.commit()
    return {"screenshotPath": url}

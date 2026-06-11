import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import bookings_col
from drive import upload_screenshot

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


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


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
def get_availability(courtId: str, date: str):
    bookings = list(bookings_col.find(
        {"courtId": courtId, "date": date, "status": {"$ne": "cancelled"}},
        {"timeStart": 1, "duration": 1}
    ))
    booked = set()
    for b in bookings:
        start = int(b["timeStart"].split(":")[0])
        for i in range(b["duration"]):
            booked.add(start + i)
    return {"bookedSlots": list(booked)}


@router.get("/")
def list_bookings(admin: bool = Depends(require_admin)):
    docs = list(bookings_col.find({}).sort("createdAt", -1))
    return [_clean(d) for d in docs]


@router.post("/")
def create_booking(body: BookingCreate):
    start_hour = int(body.timeStart.split(":")[0])
    wanted = set(start_hour + i for i in range(body.duration))

    conflicts = list(bookings_col.find(
        {"courtId": body.courtId, "date": body.date, "status": {"$ne": "cancelled"}},
        {"timeStart": 1, "duration": 1}
    ))
    for b in conflicts:
        b_start = int(b["timeStart"].split(":")[0])
        b_slots = set(b_start + i for i in range(b["duration"]))
        if wanted & b_slots:
            raise HTTPException(status_code=409, detail="This time slot is already booked.")

    end_hour = start_hour + body.duration
    time_end = f"{str(end_hour).zfill(2)}:00"
    status = "pending_cash" if body.paymentMethod == "cash" else "pending"
    booking_id = str(uuid.uuid4())

    doc = {
        "id": booking_id,
        "referenceNumber": _gen_ref(),
        "courtId": body.courtId,
        "courtName": body.courtName,
        "date": body.date,
        "timeStart": body.timeStart,
        "timeEnd": time_end,
        "duration": body.duration,
        "pricePerHour": body.pricePerHour,
        "totalAmount": body.totalAmount,
        "customerName": body.customerName,
        "customerEmail": body.customerEmail or "",
        "customerPhone": body.customerPhone,
        "paymentMethod": body.paymentMethod,
        "gcashReference": body.gcashReference or "",
        "screenshotPath": "",
        "notes": body.notes or "",
        "status": status,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": None,
    }
    bookings_col.insert_one(doc)
    return _clean(doc)


@router.get("/{booking_id}")
def get_booking(booking_id: str, admin: bool = Depends(require_admin)):
    doc = bookings_col.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _clean(doc)


@router.put("/{booking_id}")
def update_booking(booking_id: str, body: BookingUpdate, admin: bool = Depends(require_admin)):
    doc = bookings_col.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")

    updates = {"updatedAt": datetime.now().isoformat()}
    if body.status is not None:
        updates["status"] = body.status
    if body.gcashReference is not None:
        updates["gcashReference"] = body.gcashReference
    if body.notes is not None:
        updates["notes"] = body.notes

    bookings_col.update_one({"id": booking_id}, {"$set": updates})
    doc.update(updates)
    return _clean(doc)


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str, admin: bool = Depends(require_admin)):
    doc = bookings_col.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    bookings_col.update_one({"id": booking_id}, {"$set": {"status": "cancelled", "updatedAt": datetime.now().isoformat()}})
    return {"message": "Booking cancelled"}


@router.post("/{booking_id}/screenshot")
async def upload_booking_screenshot(booking_id: str, file: UploadFile = File(...)):
    doc = bookings_col.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")

    content = await file.read()
    mime = file.content_type or "image/jpeg"
    ext = os.path.splitext(file.filename or "screenshot.jpg")[1] or ".jpg"
    filename = f"{booking_id}{ext}"

    try:
        url = upload_screenshot(content, filename, mime)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drive upload failed: {e}")

    bookings_col.update_one(
        {"id": booking_id},
        {"$set": {"screenshotPath": url, "updatedAt": datetime.now().isoformat()}}
    )
    return {"screenshotPath": url}

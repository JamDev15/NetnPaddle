import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "bookings.json")
ADMIN_TOKEN = "nnp-admin-secure-2026"


# ── helpers ──────────────────────────────────────────────────────────────────

def _read():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, encoding="utf-8") as f:
        txt = f.read().strip()
        return json.loads(txt) if txt else []


def _write(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _gen_ref():
    date_part = datetime.now().strftime("%Y%m%d")
    rand = str(uuid.uuid4().int)[:4]
    return f"NNP-{date_part}-{rand}"


def require_admin(authorization: str = Header(None)):
    if not authorization or authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


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
    bookings = _read()
    day = [b for b in bookings if b["courtId"] == courtId and b["date"] == date and b["status"] != "cancelled"]
    booked = set()
    for b in day:
        start = int(b["timeStart"].split(":")[0])
        for i in range(b["duration"]):
            booked.add(start + i)
    return {"bookedSlots": list(booked)}


@router.get("/")
def list_bookings(admin: bool = Depends(require_admin)):
    data = _read()
    return sorted(data, key=lambda b: b["createdAt"], reverse=True)


@router.post("/")
def create_booking(body: BookingCreate):
    bookings = _read()

    start_hour = int(body.timeStart.split(":")[0])
    wanted = [start_hour + i for i in range(body.duration)]

    for b in bookings:
        if b["courtId"] != body.courtId or b["date"] != body.date or b["status"] == "cancelled":
            continue
        b_start = int(b["timeStart"].split(":")[0])
        b_slots = [b_start + i for i in range(b["duration"])]
        if any(h in b_slots for h in wanted):
            raise HTTPException(status_code=409, detail="This time slot is already booked.")

    end_hour = start_hour + body.duration
    time_end = f"{str(end_hour).zfill(2)}:00"
    status = "pending_cash" if body.paymentMethod == "cash" else "pending"

    new_booking = {
        "id": str(uuid.uuid4()),
        "referenceNumber": _gen_ref(),
        **body.dict(),
        "timeEnd": time_end,
        "status": status,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": None,
    }

    bookings.append(new_booking)
    _write(bookings)
    return new_booking


@router.get("/{booking_id}")
def get_booking(booking_id: str, admin: bool = Depends(require_admin)):
    bookings = _read()
    b = next((x for x in bookings if x["id"] == booking_id), None)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b


@router.put("/{booking_id}")
def update_booking(booking_id: str, body: BookingUpdate, admin: bool = Depends(require_admin)):
    bookings = _read()
    idx = next((i for i, b in enumerate(bookings) if b["id"] == booking_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if body.status is not None:
        bookings[idx]["status"] = body.status
    if body.gcashReference is not None:
        bookings[idx]["gcashReference"] = body.gcashReference
    if body.notes is not None:
        bookings[idx]["notes"] = body.notes
    bookings[idx]["updatedAt"] = datetime.now().isoformat()

    _write(bookings)
    return bookings[idx]


@router.delete("/{booking_id}")
def cancel_booking(booking_id: str, admin: bool = Depends(require_admin)):
    bookings = _read()
    idx = next((i for i, b in enumerate(bookings) if b["id"] == booking_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    bookings[idx]["status"] = "cancelled"
    bookings[idx]["updatedAt"] = datetime.now().isoformat()
    _write(bookings)
    return {"message": "Booking cancelled"}

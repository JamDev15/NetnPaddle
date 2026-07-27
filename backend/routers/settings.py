import os
import sys
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import get_db
from models import Setting, ClosedPeriod

router = APIRouter()

ADMIN_TOKEN = "nnp-admin-secure-2026"

BOOKINGS_OPEN_KEY = "bookings_open"
CLOSED_MESSAGE_KEY = "bookings_closed_message"


def require_admin(authorization: str = Header(None)):
    if not authorization or authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


def _get_setting(db: Session, key: str, default: str) -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    return row.value if row else default


def _set_setting(db: Session, key: str, value: str):
    row = db.query(Setting).filter(Setting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(Setting(key=key, value=value))
    db.commit()


def bookings_are_open(db: Session) -> bool:
    return _get_setting(db, BOOKINGS_OPEN_KEY, "true") == "true"


class BookingStatusUpdate(BaseModel):
    bookingsOpen: bool
    closedMessage: Optional[str] = None


@router.get("/booking-status")
def get_booking_status(db: Session = Depends(get_db)):
    return {
        "bookingsOpen": bookings_are_open(db),
        "closedMessage": _get_setting(db, CLOSED_MESSAGE_KEY, ""),
    }


@router.put("/booking-status")
def set_booking_status(body: BookingStatusUpdate, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    _set_setting(db, BOOKINGS_OPEN_KEY, "true" if body.bookingsOpen else "false")
    if body.closedMessage is not None:
        _set_setting(db, CLOSED_MESSAGE_KEY, body.closedMessage)
    return {
        "bookingsOpen": bookings_are_open(db),
        "closedMessage": _get_setting(db, CLOSED_MESSAGE_KEY, ""),
    }


# ── date-range closures ───────────────────────────────────────────────────────

def closed_period_to_dict(p: ClosedPeriod) -> dict:
    return {
        "id": p.id, "startDate": p.startDate, "endDate": p.endDate,
        "startTime": p.startTime, "endTime": p.endTime,
        "reason": p.reason, "createdAt": p.createdAt,
    }


def hour_closed_reason(db: Session, date_str: str, hour: int) -> Optional[str]:
    """Returns the closure reason if the given hour on date_str is blocked by any closed period, else None."""
    periods = db.query(ClosedPeriod).filter(
        ClosedPeriod.startDate <= date_str,
        ClosedPeriod.endDate >= date_str,
    ).all()
    for p in periods:
        if p.startTime and p.endTime:
            start_hour = int(p.startTime.split(":")[0])
            end_hour = int(p.endTime.split(":")[0])
            if start_hour <= hour < end_hour:
                return p.reason or "Closed"
        else:
            return p.reason or "Closed"
    return None


class ClosedPeriodCreate(BaseModel):
    startDate: str
    endDate: str
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    reason: Optional[str] = ""


@router.get("/closed-periods")
def list_closed_periods(db: Session = Depends(get_db)):
    return [closed_period_to_dict(p) for p in db.query(ClosedPeriod).order_by(ClosedPeriod.startDate).all()]


@router.post("/closed-periods")
def create_closed_period(body: ClosedPeriodCreate, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    if body.endDate < body.startDate:
        raise HTTPException(status_code=400, detail="End date must be on or after start date")
    if bool(body.startTime) != bool(body.endTime):
        raise HTTPException(status_code=400, detail="Provide both a start and end time, or leave both blank to close the whole day")
    if body.startTime and body.endTime and body.endTime <= body.startTime:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    period = ClosedPeriod(
        id=str(uuid.uuid4()), startDate=body.startDate, endDate=body.endDate,
        startTime=body.startTime or None, endTime=body.endTime or None,
        reason=body.reason or "", createdAt=datetime.now().isoformat(),
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return closed_period_to_dict(period)


@router.delete("/closed-periods/{period_id}")
def delete_closed_period(period_id: str, admin: bool = Depends(require_admin), db: Session = Depends(get_db)):
    period = db.query(ClosedPeriod).filter(ClosedPeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Closed period not found")
    db.delete(period)
    db.commit()
    return {"message": "Closed period removed"}

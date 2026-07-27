from sqlalchemy import Column, Integer, String
from database import Base


class Setting(Base):
    __tablename__ = "settings"

    key   = Column(String, primary_key=True)
    value = Column(String)


class ClosedPeriod(Base):
    __tablename__ = "closed_periods"

    id        = Column(String, primary_key=True, index=True)
    startDate = Column(String, index=True)
    endDate   = Column(String, index=True)
    startTime = Column(String, nullable=True)  # e.g. "14:00" — null means whole day
    endTime   = Column(String, nullable=True)  # e.g. "17:00" — exclusive
    reason    = Column(String, default="")
    createdAt = Column(String)


class Booking(Base):
    __tablename__ = "bookings"

    id              = Column(String, primary_key=True, index=True)
    referenceNumber = Column(String, unique=True, index=True)
    courtId         = Column(String)
    courtName       = Column(String)
    date            = Column(String, index=True)
    timeStart       = Column(String)
    timeEnd         = Column(String)
    duration        = Column(Integer)
    pricePerHour    = Column(Integer)
    totalAmount     = Column(Integer)
    customerName    = Column(String)
    customerEmail   = Column(String, default="")
    customerPhone   = Column(String)
    paymentMethod   = Column(String)
    gcashReference  = Column(String, default="")
    screenshotPath  = Column(String, default="")
    notes           = Column(String, default="")
    status          = Column(String, default="pending")
    createdAt       = Column(String)
    updatedAt       = Column(String, nullable=True)

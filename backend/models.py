from sqlalchemy import Column, Integer, String
from database import Base


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

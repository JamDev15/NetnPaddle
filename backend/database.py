import os
from pymongo import MongoClient

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")

client = MongoClient(MONGODB_URI)
db = client["netpaddle"]
bookings_col = db["bookings"]

bookings_col.create_index("referenceNumber", unique=True)
bookings_col.create_index("date")
bookings_col.create_index([("courtId", 1), ("date", 1)])

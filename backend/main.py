import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from routers import auth, courts, bookings, settings
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

# create_all() only creates missing tables — it won't add new columns to a
# table that already existed from a previous deploy, so new columns need a
# one-off ALTER TABLE here.
_MIGRATIONS = [
    ("closed_periods", "courtId", "VARCHAR"),
]
_inspector = inspect(engine)
for _table, _column, _coltype in _MIGRATIONS:
    if _table in _inspector.get_table_names():
        _existing_columns = [c["name"] for c in _inspector.get_columns(_table)]
        if _column not in _existing_columns:
            with engine.begin() as _conn:
                _conn.execute(text(f'ALTER TABLE {_table} ADD COLUMN "{_column}" {_coltype}'))

app = FastAPI(title="Net N' Paddle API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://netnpaddletagum.com",
        "https://www.netnpaddletagum.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(courts.router, prefix="/api/courts", tags=["Courts"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])

# Serve local screenshots (fallback when Google Drive not configured)
_base_dir = "/data" if os.path.isdir("/data") else os.path.dirname(__file__)
uploads_dir = os.path.join(_base_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
def root():
    return {"message": "Net N' Paddle API is running 🏓"}

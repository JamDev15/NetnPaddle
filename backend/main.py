import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, courts, bookings
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Net N' Paddle API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(courts.router, prefix="/api/courts", tags=["Courts"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])

# Serve uploaded payment screenshots
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
def root():
    return {"message": "Net N' Paddle API is running 🏓"}

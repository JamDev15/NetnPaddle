from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, courts, bookings

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


@app.get("/")
def root():
    return {"message": "Net N' Paddle API is running 🏓"}

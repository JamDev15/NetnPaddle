from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "netpaddle2026"
ADMIN_TOKEN = "nnp-admin-secure-2026"


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
        return {"token": ADMIN_TOKEN, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid username or password")


@router.post("/logout")
def logout():
    return {"message": "Logged out"}

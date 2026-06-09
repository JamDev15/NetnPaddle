import json
import os
from fastapi import APIRouter

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "courts.json")


@router.get("/")
def get_courts():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)

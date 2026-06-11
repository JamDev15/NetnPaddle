import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

_data_dir = "/data" if os.path.isdir("/data") else os.path.join(os.path.dirname(__file__), "data")
os.makedirs(_data_dir, exist_ok=True)
DB_PATH = os.path.join(_data_dir, "netpaddle.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

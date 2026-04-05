"""
database.py — SQLAlchemy engine + session factory
Connects to SQL Server Express via Windows Authentication (no user/pass).
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_SERVER = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS01")
DB_NAME   = os.getenv("DB_NAME",   "CanteenFeedbackDB")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

# Windows Authentication — no username / password
CONNECTION_STRING = (
    f"mssql+pyodbc://{DB_SERVER}/{DB_NAME}"
    f"?driver={DB_DRIVER.replace(' ', '+')}"
    f"&trusted_connection=yes"
)

engine = create_engine(
    CONNECTION_STRING,
    echo=False,          # set True if you want SQL debug logs
    pool_pre_ping=True,  # auto-reconnect on stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

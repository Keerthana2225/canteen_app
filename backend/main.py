"""
main.py — FastAPI application entry point.

Starts the Canteen Feedback API on 0.0.0.0:8000
MSSQL tables are auto-created on startup via Base.metadata.create_all().
New columns (overall_rating, is_critical) are added via ALTER TABLE migration
if they do not already exist — safe to run on existing databases.
CORS is fully open so tablet/mobile/browser can all reach the backend.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from database import engine, Base, SessionLocal
from routers import feedback as feedback_router
from routers import export   as export_router
from routers import analytics as analytics_router

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────
app = FastAPI(
    title       = "Canteen Feedback API",
    description = "Canteen feedback system — MSSQL backend with critical feedback detection",
    version     = "3.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ─────────────────────────────────────────────
# CORS — allow all origins for tablet/mobile/browser
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─────────────────────────────────────────────
# Static files (logo, etc.)
# ─────────────────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ─────────────────────────────────────────────
# DB Migration — safely add new columns
# ─────────────────────────────────────────────
def _run_migration(db):
    """
    Safely add new columns to the Feedback table if they do not exist.
    Works with SQL Server using INFORMATION_SCHEMA.COLUMNS check.
    Also back-fills overall_rating and is_critical for existing rows.
    """
    from sqlalchemy import text

    # Check + add overall_rating
    result = db.execute(text(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_NAME='Feedback' AND COLUMN_NAME='overall_rating'"
    )).scalar()
    if result == 0:
        db.execute(text("ALTER TABLE Feedback ADD overall_rating FLOAT NULL"))
        db.commit()
        print("✅ Migration: Added overall_rating column to Feedback table")
        # Back-fill for existing rows
        db.execute(text(
            "UPDATE Feedback SET overall_rating = "
            "(CAST(food_quality AS FLOAT) + food_taste + food_hygiene + "
            "staff_behavior + cleanliness) / 5.0 "
            "WHERE overall_rating IS NULL"
        ))
        db.commit()
        print("✅ Migration: Back-filled overall_rating for existing records")

    # Check + add is_critical
    result = db.execute(text(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_NAME='Feedback' AND COLUMN_NAME='is_critical'"
    )).scalar()
    if result == 0:
        db.execute(text("ALTER TABLE Feedback ADD is_critical INT NULL DEFAULT 0"))
        db.commit()
        print("✅ Migration: Added is_critical column to Feedback table")
        db.execute(text(
            "UPDATE Feedback SET is_critical = "
            "CASE WHEN overall_rating <= 2 THEN 1 ELSE 0 END "
            "WHERE is_critical IS NULL"
        ))
        db.commit()
        print("✅ Migration: Back-filled is_critical for existing records")


# ─────────────────────────────────────────────
# Auto-create tables + run migration on startup
# ─────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    import models
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ready")

    db = SessionLocal()
    try:
        # Seed default Canteen if not present
        if not db.query(models.Canteen).filter(models.Canteen.id == 1).first():
            db.add(models.Canteen(id=1, name="Main Canteen", location="Headquarters"))
            db.commit()
            print("✅ Seeded default Canteen record")

        # Run column migrations
        _run_migration(db)

    except Exception as e:
        print(f"⚠️  Migration warning: {e}")
    finally:
        db.close()


# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────
app.include_router(feedback_router.router)
app.include_router(export_router.router)
app.include_router(analytics_router.router)


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "Canteen API running", "version": "3.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {
        "status":   "ok",
        "service":  "Canteen Feedback API",
        "version":  "3.0.0",
        "features": ["critical-feedback", "5-meal-types", "day-reports", "multilingual"],
    }


# ─────────────────────────────────────────────
# Dev server entrypoint
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host      = "0.0.0.0",   # listen on all interfaces → mobile can connect
        port      = 8000,
        reload    = True,
        log_level = "info",
    )
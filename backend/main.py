"""
main.py — FastAPI application entry point.

Starts the Canteen Feedback API on 0.0.0.0:8000
SQLite tables are auto-created on startup — no manual DB setup required.
CORS is fully open so tablet/mobile/browser can all reach the backend.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from database import engine, Base
from routers import feedback as feedback_router
from routers import export   as export_router
from routers import analytics as analytics_router

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────
app = FastAPI(
    title       = "Canteen Feedback API",
    description = "Offline canteen feedback system — SQLite backend",
    version     = "2.0.0",
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
# Auto-create SQLite tables on startup
# ─────────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    print("✅  SQL Server tables ready — CanteenFeedbackDB connected")
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        # Prevent ForeignKey constraint error on submit by seeding the default Canteen
        if not db.query(models.Canteen).filter(models.Canteen.id == 1).first():
            db.add(models.Canteen(id=1, name="Main Canteen", location="Headquarters"))
            db.commit()
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
    return {"status": "Canteen API running", "db": "SQLite (offline)"}


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "Canteen Feedback API",
        "version": "2.0.0",
        "database": "SQLite",
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
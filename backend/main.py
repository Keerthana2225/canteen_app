"""
main.py — FastAPI application entry point.

Starts the Canteen Feedback API on 0.0.0.0:8000
CORS is fully open so the tablet app can reach the PC backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import feedback as feedback_router
from routers import export   as export_router

# ─────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────
app = FastAPI(
    title       = "Canteen Feedback API",
    description = "Anonymous canteen feedback collection system",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ─────────────────────────────────────────────
# CORS — allow all origins for tablet access
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],   # tablet / mobile / browser
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────
app.include_router(feedback_router.router)
app.include_router(export_router.router)


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "Canteen API running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "Canteen Feedback API", "version": "1.0.0"}


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

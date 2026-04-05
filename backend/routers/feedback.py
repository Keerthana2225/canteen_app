"""
routers/feedback.py — Core feedback API endpoints.

Endpoints:
  POST /feedback          — Submit anonymous feedback
  GET  /feedback/summary  — Aggregated averages for admin dashboard
  GET  /feedback/all      — All records (date fields hidden from web UI)
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import get_db

router = APIRouter(prefix="/feedback", tags=["Feedback"])


# ─────────────────────────────────────────────────────────────
# POST /feedback  — Anonymous submission
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=schemas.SuccessResponse, status_code=201)
def submit_feedback(payload: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    """
    Accept anonymous canteen feedback.
    No identity fields are collected or stored.
    feedback_date and created_at are auto-set by the server.
    """
    feedback = models.Feedback(
        canteen_id     = payload.canteen_id,
        canteen_name   = payload.canteen_name,
        meal_type      = payload.meal_type,
        food_quality   = payload.food_quality,
        food_taste     = payload.food_taste,
        food_hygiene   = payload.food_hygiene,
        staff_behavior = payload.staff_behavior,
        cleanliness    = payload.cleanliness,
        comments       = payload.comments,
        feedback_date  = date.today(),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {"message": "Feedback submitted successfully"}


# ─────────────────────────────────────────────────────────────
# GET /feedback/summary  — Dashboard aggregates
# ─────────────────────────────────────────────────────────────
@router.get("/summary", response_model=schemas.SummaryResponse)
def get_summary(
    meal_type:    Optional[str] = Query(None, description="Breakfast | Lunch | Dinner"),
    canteen_name: Optional[str] = Query(None),
    from_date:    Optional[date] = Query(None),
    to_date:      Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Return average ratings and total feedback count, with optional filters."""
    q = db.query(models.Feedback)

    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)
    if canteen_name:
        q = q.filter(models.Feedback.canteen_name == canteen_name)
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)

    results = q.with_entities(
        func.avg(models.Feedback.food_quality).label("avg_food_quality"),
        func.avg(models.Feedback.food_taste).label("avg_food_taste"),
        func.avg(models.Feedback.food_hygiene).label("avg_food_hygiene"),
        func.avg(models.Feedback.staff_behavior).label("avg_staff_behavior"),
        func.avg(models.Feedback.cleanliness).label("avg_cleanliness"),
        func.count(models.Feedback.id).label("total_count"),
    ).one()

    def _round(val):
        return round(float(val), 2) if val is not None else 0.0

    return schemas.SummaryResponse(
        avg_food_quality   = _round(results.avg_food_quality),
        avg_food_taste     = _round(results.avg_food_taste),
        avg_food_hygiene   = _round(results.avg_food_hygiene),
        avg_staff_behavior = _round(results.avg_staff_behavior),
        avg_cleanliness    = _round(results.avg_cleanliness),
        total_count        = results.total_count or 0,
        meal_type_filter   = meal_type,
        canteen_filter     = canteen_name,
    )


# ─────────────────────────────────────────────────────────────
# GET /feedback/all  — List records (date fields excluded)
# ─────────────────────────────────────────────────────────────
@router.get("/all", response_model=list[schemas.FeedbackPublic])
def get_all_feedback(
    meal_type:    Optional[str]  = Query(None),
    canteen_name: Optional[str]  = Query(None),
    from_date:    Optional[date] = Query(None),
    to_date:      Optional[date] = Query(None),
    skip:         int            = Query(0,  ge=0),
    limit:        int            = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Return all feedback records.
    feedback_date and created_at are intentionally excluded from this response
    (they are only visible in the Excel export).
    """
    q = db.query(models.Feedback)

    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)
    if canteen_name:
        q = q.filter(models.Feedback.canteen_name == canteen_name)
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)

    records = q.order_by(models.Feedback.id.desc()).offset(skip).limit(limit).all()
    return records


# ─────────────────────────────────────────────────────────────
# GET /feedback/count  — Total record count (for pagination)
# ─────────────────────────────────────────────────────────────
@router.get("/count")
def get_feedback_count(
    meal_type:    Optional[str]  = Query(None),
    canteen_name: Optional[str]  = Query(None),
    from_date:    Optional[date] = Query(None),
    to_date:      Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(func.count(models.Feedback.id))
    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)
    if canteen_name:
        q = q.filter(models.Feedback.canteen_name == canteen_name)
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)
    return {"total": q.scalar()}

"""
routers/feedback.py — Core feedback API endpoints.

Endpoints:
  POST /feedback          — Submit anonymous feedback (auto-computes overall_rating + is_critical)
  GET  /feedback/summary  — Aggregated averages with optional filters
  GET  /feedback/all      — All records (paginated), includes dates & critical flag
  GET  /feedback/count    — Total record count
  GET  /feedback/critical — All critical feedback (is_critical=1) with date/meal/comment
  GET  /feedback/day-report — Day-wise aggregated feedback report
"""

from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, text

import models
import schemas
from database import get_db

router = APIRouter(prefix="/feedback", tags=["Feedback"])

ALL_MEAL_TYPES = [
    "Breakfast", "Lunch", "Dinner", "Midnight Supper", "Early Morning Breakfast"
]


# ─────────────────────────────────────────────────────────────
# POST /feedback  — Anonymous submission
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=schemas.SuccessResponse, status_code=201)
def submit_feedback(payload: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    """
    Accept anonymous canteen feedback.
    Automatically computes overall_rating (avg of 5 categories) and is_critical flag.
    overall_rating < 2 → is_critical = 1.
    If any individual rating = 1, comments must be provided (validated by schema).
    """
    overall = (
        payload.food_quality +
        payload.food_taste +
        payload.food_hygiene +
        payload.staff_behavior +
        payload.cleanliness
    ) / 5.0

    feedback = models.Feedback(
        canteen_id     = payload.canteen_id,
        canteen_name   = payload.canteen_name,
        meal_type      = payload.meal_type,
        food_quality   = payload.food_quality,
        food_taste     = payload.food_taste,
        food_hygiene   = payload.food_hygiene,
        staff_behavior = payload.staff_behavior,
        cleanliness    = payload.cleanliness,
        overall_rating = round(overall, 2),
        is_critical    = 1 if overall <= 2 else 0,
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
    meal_type:    Optional[str]  = Query(None, description="Breakfast | Lunch | Dinner | Midnight Supper | Early Morning Breakfast"),
    canteen_name: Optional[str]  = Query(None),
    from_date:    Optional[date] = Query(None),
    to_date:      Optional[date] = Query(None),
    month:        Optional[int]  = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year:         Optional[int]  = Query(None, description="Filter by year e.g. 2026"),
    db: Session = Depends(get_db),
):
    """Return average ratings, overall avg, critical count, and total feedback count."""
    q = db.query(models.Feedback)

    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)
    if canteen_name:
        q = q.filter(models.Feedback.canteen_name == canteen_name)
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)
    if month:
        q = q.filter(extract("month", models.Feedback.feedback_date) == month)
    if year:
        q = q.filter(extract("year", models.Feedback.feedback_date) == year)

    results = q.with_entities(
        func.avg(models.Feedback.food_quality).label("avg_food_quality"),
        func.avg(models.Feedback.food_taste).label("avg_food_taste"),
        func.avg(models.Feedback.food_hygiene).label("avg_food_hygiene"),
        func.avg(models.Feedback.staff_behavior).label("avg_staff_behavior"),
        func.avg(models.Feedback.cleanliness).label("avg_cleanliness"),
        func.avg(models.Feedback.overall_rating).label("avg_overall"),
        func.count(models.Feedback.id).label("total_count"),
        func.sum(models.Feedback.is_critical).label("critical_count"),
    ).one()

    def _round(val):
        return round(float(val), 2) if val is not None else 0.0

    return schemas.SummaryResponse(
        avg_food_quality   = _round(results.avg_food_quality),
        avg_food_taste     = _round(results.avg_food_taste),
        avg_food_hygiene   = _round(results.avg_food_hygiene),
        avg_staff_behavior = _round(results.avg_staff_behavior),
        avg_cleanliness    = _round(results.avg_cleanliness),
        avg_overall        = _round(results.avg_overall),
        total_count        = results.total_count or 0,
        critical_count     = int(results.critical_count or 0),
        meal_type_filter   = meal_type,
        canteen_filter     = canteen_name,
    )


# ─────────────────────────────────────────────────────────────
# GET /feedback/all  — List records (with dates and critical flag)
# ─────────────────────────────────────────────────────────────
@router.get("/all", response_model=List[schemas.FeedbackPublic])
def get_all_feedback(
    meal_type:    Optional[str]  = Query(None),
    canteen_name: Optional[str]  = Query(None),
    from_date:    Optional[date] = Query(None),
    to_date:      Optional[date] = Query(None),
    month:        Optional[int]  = Query(None, ge=1, le=12),
    year:         Optional[int]  = Query(None),
    is_critical:  Optional[int]  = Query(None, description="1 = critical only, 0 = non-critical only"),
    skip:         int            = Query(0,  ge=0),
    limit:        int            = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Return all feedback records including dates and critical flag for reporting."""
    q = db.query(models.Feedback)

    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)
    if canteen_name:
        q = q.filter(models.Feedback.canteen_name == canteen_name)
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)
    if month:
        q = q.filter(extract("month", models.Feedback.feedback_date) == month)
    if year:
        q = q.filter(extract("year", models.Feedback.feedback_date) == year)
    if is_critical is not None:
        q = q.filter(models.Feedback.is_critical == is_critical)

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
    month:        Optional[int]  = Query(None, ge=1, le=12),
    year:         Optional[int]  = Query(None),
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
    if month:
        q = q.filter(extract("month", models.Feedback.feedback_date) == month)
    if year:
        q = q.filter(extract("year", models.Feedback.feedback_date) == year)
    return {"total": q.scalar()}


# ─────────────────────────────────────────────────────────────
# GET /feedback/critical  — All critical feedback entries
# ─────────────────────────────────────────────────────────────
@router.get("/critical", response_model=List[schemas.CriticalFeedback])
def get_critical_feedback(
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
    meal_type: Optional[str]  = Query(None),
    limit:     int            = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Return all feedback entries marked as critical (is_critical=1, i.e., overall_rating < 2).
    Includes date, meal_type, overall_rating, and comment for reporting.
    """
    q = db.query(models.Feedback).filter(models.Feedback.is_critical == 1)
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)
    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)

    return q.order_by(models.Feedback.feedback_date.desc(), models.Feedback.id.desc()).limit(limit).all()


# ─────────────────────────────────────────────────────────────
# GET /feedback/day-report  — Day-wise aggregated report
# ─────────────────────────────────────────────────────────────
@router.get("/day-report")
def get_day_report(
    from_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date:   Optional[date] = Query(None, description="End date   (YYYY-MM-DD)"),
    meal_type: Optional[str]  = Query(None),
    db: Session = Depends(get_db),
):
    """
    Return day-by-day breakdown: date, total count, critical count, avg overall rating.
    Useful for day-wise reports on the admin dashboard.
    """
    q = db.query(
        models.Feedback.feedback_date,
        func.count(models.Feedback.id).label("total"),
        func.sum(models.Feedback.is_critical).label("critical"),
        func.avg(models.Feedback.overall_rating).label("avg_rating"),
    )
    if from_date:
        q = q.filter(models.Feedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(models.Feedback.feedback_date <= to_date)
    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)

    rows = q.group_by(models.Feedback.feedback_date).order_by(models.Feedback.feedback_date.desc()).all()

    return [
        {
            "date":         str(r.feedback_date),
            "total":        r.total or 0,
            "critical":     int(r.critical or 0),
            "avg_rating":   round(float(r.avg_rating), 2) if r.avg_rating else 0.0,
        }
        for r in rows
    ]

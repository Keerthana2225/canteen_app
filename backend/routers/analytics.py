"""
routers/analytics.py — Monthly analytics endpoint.

GET /analytics/monthly?year=2026&month=4
  Returns average ratings and total count for the specified month/year.
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

import models
from database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/monthly")
def get_monthly_analytics(
    year:  int           = Query(...,  description="Year  e.g. 2026"),
    month: int           = Query(...,  ge=1, le=12, description="Month 1-12"),
    meal_type: Optional[str] = Query(None, description="Breakfast | Lunch | Dinner"),
    db: Session = Depends(get_db),
):
    """
    Return average ratings and count for a specific month/year.
    Optionally filter by meal type.
    """
    q = db.query(models.Feedback).filter(
        extract("year",  models.Feedback.feedback_date) == year,
        extract("month", models.Feedback.feedback_date) == month,
    )
    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)

    results = q.with_entities(
        func.avg(models.Feedback.food_quality).label("avg_food_quality"),
        func.avg(models.Feedback.food_taste).label("avg_food_taste"),
        func.avg(models.Feedback.food_hygiene).label("avg_food_hygiene"),
        func.avg(models.Feedback.staff_behavior).label("avg_staff_behavior"),
        func.avg(models.Feedback.cleanliness).label("avg_cleanliness"),
        func.count(models.Feedback.id).label("total_count"),
    ).one()

    # Per-meal-type counts for this month
    base_q = db.query(models.Feedback).filter(
        extract("year",  models.Feedback.feedback_date) == year,
        extract("month", models.Feedback.feedback_date) == month,
    )
    breakfast_count = base_q.filter(models.Feedback.meal_type == "Breakfast").count()
    lunch_count     = base_q.filter(models.Feedback.meal_type == "Lunch").count()
    dinner_count    = base_q.filter(models.Feedback.meal_type == "Dinner").count()

    def _r(v):
        return round(float(v), 2) if v is not None else 0.0

    return {
        "year":               year,
        "month":              month,
        "meal_type_filter":   meal_type,
        "total_count":        results.total_count or 0,
        "breakfast_count":    breakfast_count,
        "lunch_count":        lunch_count,
        "dinner_count":       dinner_count,
        "avg_food_quality":   _r(results.avg_food_quality),
        "avg_food_taste":     _r(results.avg_food_taste),
        "avg_food_hygiene":   _r(results.avg_food_hygiene),
        "avg_staff_behavior": _r(results.avg_staff_behavior),
        "avg_cleanliness":    _r(results.avg_cleanliness),
    }


@router.get("/yearly")
def get_yearly_overview(
    year: int = Query(..., description="Year e.g. 2026"),
    db: Session = Depends(get_db),
):
    """Return month-by-month breakdown for a full year."""
    rows = []
    for month in range(1, 13):
        q = db.query(models.Feedback).filter(
            extract("year",  models.Feedback.feedback_date) == year,
            extract("month", models.Feedback.feedback_date) == month,
        )
        res = q.with_entities(
            func.avg(models.Feedback.food_quality).label("avg_food_quality"),
            func.avg(models.Feedback.food_taste).label("avg_food_taste"),
            func.avg(models.Feedback.food_hygiene).label("avg_food_hygiene"),
            func.avg(models.Feedback.staff_behavior).label("avg_staff_behavior"),
            func.avg(models.Feedback.cleanliness).label("avg_cleanliness"),
            func.count(models.Feedback.id).label("total_count"),
        ).one()

        def _r(v):
            return round(float(v), 2) if v is not None else 0.0

        rows.append({
            "month":             month,
            "total_count":       res.total_count or 0,
            "avg_food_quality":  _r(res.avg_food_quality),
            "avg_food_taste":    _r(res.avg_food_taste),
            "avg_food_hygiene":  _r(res.avg_food_hygiene),
            "avg_staff_behavior":_r(res.avg_staff_behavior),
            "avg_cleanliness":   _r(res.avg_cleanliness),
        })

    return {"year": year, "months": rows}

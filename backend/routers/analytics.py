"""
routers/analytics.py — Analytics endpoints.

GET /analytics/monthly?year=2026&month=4
  Returns average ratings, total count, and meal-type breakdown for the month.
  Supports all 5 meal types.

GET /analytics/yearly?year=2026
  Month-by-month breakdown for a full year.

GET /analytics/daily?year=2026&month=4
  Day-by-day breakdown for a specific month.

GET /analytics/meal-report
  Aggregated stats per meal type (all time or filtered by date range).
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

import models
from database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

ALL_MEAL_TYPES = [
    "Breakfast", "Lunch", "Dinner", "Midnight Supper", "Early Morning Breakfast"
]


@router.get("/monthly")
def get_monthly_analytics(
    year:      int           = Query(...,  description="Year  e.g. 2026"),
    month:     int           = Query(...,  ge=1, le=12, description="Month 1-12"),
    meal_type: Optional[str] = Query(None, description="Filter by meal type"),
    db: Session = Depends(get_db),
):
    """Return average ratings, count, and meal-type breakdown for a specific month/year."""
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
        func.avg(models.Feedback.overall_rating).label("avg_overall"),
        func.count(models.Feedback.id).label("total_count"),
        func.sum(models.Feedback.is_critical).label("critical_count"),
    ).one()

    def _r(v):
        return round(float(v), 2) if v is not None else 0.0

    # Per-meal-type counts
    base_q = db.query(models.Feedback).filter(
        extract("year",  models.Feedback.feedback_date) == year,
        extract("month", models.Feedback.feedback_date) == month,
    )
    meal_counts = {}
    for mt in ALL_MEAL_TYPES:
        meal_counts[mt] = base_q.filter(models.Feedback.meal_type == mt).count()

    return {
        "year":               year,
        "month":              month,
        "meal_type_filter":   meal_type,
        "total_count":        results.total_count or 0,
        "critical_count":     int(results.critical_count or 0),
        "meal_counts":        meal_counts,
        # Legacy keys for backward compat
        "breakfast_count":    meal_counts["Breakfast"],
        "lunch_count":        meal_counts["Lunch"],
        "dinner_count":       meal_counts["Dinner"],
        "midnight_supper_count": meal_counts["Midnight Supper"],
        "early_morning_count":   meal_counts["Early Morning Breakfast"],
        "avg_food_quality":   _r(results.avg_food_quality),
        "avg_food_taste":     _r(results.avg_food_taste),
        "avg_food_hygiene":   _r(results.avg_food_hygiene),
        "avg_staff_behavior": _r(results.avg_staff_behavior),
        "avg_cleanliness":    _r(results.avg_cleanliness),
        "avg_overall":        _r(results.avg_overall),
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
            func.avg(models.Feedback.overall_rating).label("avg_overall"),
            func.count(models.Feedback.id).label("total_count"),
            func.sum(models.Feedback.is_critical).label("critical_count"),
        ).one()

        def _r(v):
            return round(float(v), 2) if v is not None else 0.0

        rows.append({
            "month":             month,
            "total_count":       res.total_count or 0,
            "critical_count":    int(res.critical_count or 0),
            "avg_food_quality":  _r(res.avg_food_quality),
            "avg_food_taste":    _r(res.avg_food_taste),
            "avg_food_hygiene":  _r(res.avg_food_hygiene),
            "avg_staff_behavior":_r(res.avg_staff_behavior),
            "avg_cleanliness":   _r(res.avg_cleanliness),
            "avg_overall":       _r(res.avg_overall),
        })

    return {"year": year, "months": rows}


@router.get("/daily")
def get_daily_analytics(
    year:      int           = Query(..., description="Year e.g. 2026"),
    month:     int           = Query(..., ge=1, le=12, description="Month 1-12"),
    meal_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return day-by-day breakdown for a specific month: date, count, critical count, avg rating."""
    q = db.query(
        models.Feedback.feedback_date,
        func.count(models.Feedback.id).label("total"),
        func.sum(models.Feedback.is_critical).label("critical"),
        func.avg(models.Feedback.overall_rating).label("avg_rating"),
    ).filter(
        extract("year",  models.Feedback.feedback_date) == year,
        extract("month", models.Feedback.feedback_date) == month,
    )
    if meal_type:
        q = q.filter(models.Feedback.meal_type == meal_type)

    rows = q.group_by(models.Feedback.feedback_date).order_by(models.Feedback.feedback_date).all()

    return {
        "year": year,
        "month": month,
        "days": [
            {
                "date":      str(r.feedback_date),
                "total":     r.total or 0,
                "critical":  int(r.critical or 0),
                "avg_rating": round(float(r.avg_rating), 2) if r.avg_rating else 0.0,
            }
            for r in rows
        ]
    }


@router.get("/meal-report")
def get_meal_report(
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Return aggregated stats per meal type for all time or a date range."""
    result = []
    for mt in ALL_MEAL_TYPES:
        q = db.query(models.Feedback).filter(models.Feedback.meal_type == mt)
        if from_date:
            q = q.filter(models.Feedback.feedback_date >= from_date)
        if to_date:
            q = q.filter(models.Feedback.feedback_date <= to_date)

        res = q.with_entities(
            func.count(models.Feedback.id).label("total"),
            func.sum(models.Feedback.is_critical).label("critical"),
            func.avg(models.Feedback.overall_rating).label("avg_overall"),
            func.avg(models.Feedback.food_quality).label("avg_food_quality"),
            func.avg(models.Feedback.food_taste).label("avg_food_taste"),
            func.avg(models.Feedback.food_hygiene).label("avg_food_hygiene"),
            func.avg(models.Feedback.staff_behavior).label("avg_staff_behavior"),
            func.avg(models.Feedback.cleanliness).label("avg_cleanliness"),
        ).one()

        def _r(v):
            return round(float(v), 2) if v is not None else 0.0

        result.append({
            "meal_type":      mt,
            "total":          res.total or 0,
            "critical":       int(res.critical or 0),
            "avg_overall":    _r(res.avg_overall),
            "avg_food_quality": _r(res.avg_food_quality),
            "avg_food_taste": _r(res.avg_food_taste),
            "avg_food_hygiene": _r(res.avg_food_hygiene),
            "avg_staff_behavior": _r(res.avg_staff_behavior),
            "avg_cleanliness": _r(res.avg_cleanliness),
        })

    return {"meal_report": result}

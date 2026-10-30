"""
schemas.py — Pydantic schemas for request validation and response serialization.

Key rules:
  - meal_type: one of 5 allowed values (auto-detected by mobile app)
  - If overall_rating (avg of all 5 ratings) ≤ 2 → comments is mandatory
  - overall_rating is computed server-side (not submitted by client)
  - is_critical = 1 when overall_rating < 2
"""

import re
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, validator, root_validator


def strip_emojis(text: str) -> str:
    """
    Remove 4-byte unicode characters (emoji/supplementary chars)
    that SQL Server UCS-2 cannot store — prevents ???? corruption.
    ASCII emoji alternatives like :) are preserved.
    """
    if not text:
        return text
    # Remove characters outside Basic Multilingual Plane (U+FFFF and above)
    return re.sub(r'[\U00010000-\U0010FFFF]', '', text)


ALLOWED_MEAL_TYPES = {
    "Breakfast",
    "Lunch",
    "Dinner",
    "Midnight Supper",
    "Early Morning Breakfast",
}


# ─────────────────────────────────────────────
# Request schema — submitted from mobile app
# ─────────────────────────────────────────────
class FeedbackCreate(BaseModel):
    canteen_name:   Optional[str] = "Main Canteen"
    canteen_id:     Optional[int] = 1
    meal_type:      str           = Field(..., description="Breakfast | Lunch | Dinner | Midnight Supper | Early Morning Breakfast")
    food_quality:   int           = Field(..., ge=1, le=5)
    food_taste:     int           = Field(..., ge=1, le=5)
    food_hygiene:   int           = Field(..., ge=1, le=5)
    staff_behavior: Optional[int] = Field(None, ge=1, le=5)
    today_menu:     Optional[int] = Field(None, ge=1, le=5)
    cleanliness:    Optional[int] = Field(None, ge=1, le=5)
    hospitality:    Optional[int] = Field(None, ge=1, le=5)
    comments:       Optional[str] = None

    @root_validator(pre=True)
    def map_synonyms(cls, values):
        # Staff Behavior <-> Today's Menu
        staff = values.get("staff_behavior")
        menu = values.get("today_menu")
        if staff is None and menu is not None:
            values["staff_behavior"] = menu
        elif menu is None and staff is not None:
            values["today_menu"] = staff
        if values.get("staff_behavior") is None:
            raise ValueError("Field required: staff_behavior or today_menu must be provided (1-5)")

        # Cleanliness <-> Hospitality
        clean = values.get("cleanliness")
        hosp = values.get("hospitality")
        if clean is None and hosp is not None:
            values["cleanliness"] = hosp
        elif hosp is None and clean is not None:
            values["hospitality"] = clean
        if values.get("cleanliness") is None:
            raise ValueError("Field required: cleanliness or hospitality must be provided (1-5)")

        return values

    @validator("meal_type")
    def validate_meal_type(cls, v):
        if v not in ALLOWED_MEAL_TYPES:
            raise ValueError(f"meal_type must be one of {ALLOWED_MEAL_TYPES}")
        return v

    @validator("comments")
    def clean_comments(cls, v):
        if v:
            v = strip_emojis(v)
            v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', v).strip()
            if len(v) > 500:
                v = v[:500]
        return v or None

    @validator("canteen_name")
    def clean_canteen_name(cls, v):
        if not v:
            return "Main Canteen"
        v = strip_emojis(v)
        v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', v).strip()
        if len(v) > 100:
            v = v[:100]
        return v or "Main Canteen"


# ─────────────────────────────────────────────
# Response schema — returned to admin/export
# Includes all fields including dates, overall_rating, is_critical
# ─────────────────────────────────────────────
class FeedbackResponse(BaseModel):
    id:             int
    canteen_id:     Optional[int] = None
    canteen_name:   Optional[str] = None
    meal_type:      str
    food_quality:   int
    food_taste:     int
    food_hygiene:   int
    staff_behavior: Optional[int] = None
    today_menu:     Optional[int] = None
    cleanliness:    Optional[int] = None
    hospitality:    Optional[int] = None
    overall_rating: Optional[float] = None
    is_critical:    Optional[int] = None
    comments:       Optional[str] = None
    feedback_date:  Optional[date] = None
    created_at:     Optional[datetime] = None

    @root_validator(pre=True)
    def mirror_synonyms(cls, values):
        if hasattr(values, "__dict__"):
            clean = getattr(values, "cleanliness", None) or getattr(values, "hospitality", None)
            staff = getattr(values, "staff_behavior", None) or getattr(values, "today_menu", None)
            return {
                "id": getattr(values, "id", None),
                "canteen_id": getattr(values, "canteen_id", None),
                "canteen_name": getattr(values, "canteen_name", None),
                "meal_type": getattr(values, "meal_type", None),
                "food_quality": getattr(values, "food_quality", None),
                "food_taste": getattr(values, "food_taste", None),
                "food_hygiene": getattr(values, "food_hygiene", None),
                "staff_behavior": staff,
                "today_menu": staff,
                "cleanliness": clean,
                "hospitality": clean,
                "overall_rating": getattr(values, "overall_rating", None),
                "is_critical": getattr(values, "is_critical", None),
                "comments": getattr(values, "comments", None),
                "feedback_date": getattr(values, "feedback_date", None),
                "created_at": getattr(values, "created_at", None),
            }
        elif isinstance(values, dict):
            clean = values.get("cleanliness") or values.get("hospitality")
            staff = values.get("staff_behavior") or values.get("today_menu")
            values["cleanliness"] = clean
            values["hospitality"] = clean
            values["staff_behavior"] = staff
            values["today_menu"] = staff
        return values

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Public list schema — for dashboard/records API
# Exposes dates for day-wise reporting
# ─────────────────────────────────────────────
class FeedbackPublic(BaseModel):
    id:             int
    canteen_name:   Optional[str] = None
    meal_type:      str
    food_quality:   int
    food_taste:     int
    food_hygiene:   int
    staff_behavior: Optional[int] = None
    today_menu:     Optional[int] = None
    cleanliness:    Optional[int] = None
    hospitality:    Optional[int] = None
    overall_rating: Optional[float] = None
    is_critical:    Optional[int] = None
    comments:       Optional[str] = None
    feedback_date:  Optional[date] = None
    created_at:     Optional[datetime] = None

    @root_validator(pre=True)
    def mirror_synonyms(cls, values):
        if hasattr(values, "__dict__"):
            clean = getattr(values, "cleanliness", None) or getattr(values, "hospitality", None)
            staff = getattr(values, "staff_behavior", None) or getattr(values, "today_menu", None)
            return {
                "id": getattr(values, "id", None),
                "canteen_name": getattr(values, "canteen_name", None),
                "meal_type": getattr(values, "meal_type", None),
                "food_quality": getattr(values, "food_quality", None),
                "food_taste": getattr(values, "food_taste", None),
                "food_hygiene": getattr(values, "food_hygiene", None),
                "staff_behavior": staff,
                "today_menu": staff,
                "cleanliness": clean,
                "hospitality": clean,
                "overall_rating": getattr(values, "overall_rating", None),
                "is_critical": getattr(values, "is_critical", None),
                "comments": getattr(values, "comments", None),
                "feedback_date": getattr(values, "feedback_date", None),
                "created_at": getattr(values, "created_at", None),
            }
        elif isinstance(values, dict):
            clean = values.get("cleanliness") or values.get("hospitality")
            staff = values.get("staff_behavior") or values.get("today_menu")
            values["cleanliness"] = clean
            values["hospitality"] = clean
            values["staff_behavior"] = staff
            values["today_menu"] = staff
        return values

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Summary schema — for dashboard stats
# ─────────────────────────────────────────────
class SummaryResponse(BaseModel):
    avg_food_quality:   float
    avg_food_taste:     float
    avg_food_hygiene:   float
    avg_staff_behavior: Optional[float] = None
    avg_today_menu:     Optional[float] = None
    avg_cleanliness:    Optional[float] = None
    avg_hospitality:    Optional[float] = None
    avg_overall:        float
    total_count:        int
    critical_count:     int
    meal_type_filter:   Optional[str] = None
    canteen_filter:     Optional[str] = None



# ─────────────────────────────────────────────
# Critical feedback schema
# ─────────────────────────────────────────────
class CriticalFeedback(BaseModel):
    id:             int
    meal_type:      str
    overall_rating: Optional[float]
    comments:       Optional[str]
    feedback_date:  Optional[date]
    created_at:     Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Generic success response
# ─────────────────────────────────────────────
class SuccessResponse(BaseModel):
    message: str

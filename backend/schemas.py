"""
schemas.py — Pydantic schemas for request validation and response serialization.
"""

import re
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


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


# ─────────────────────────────────────────────
# Request schema — submitted from mobile app
# ─────────────────────────────────────────────
class FeedbackCreate(BaseModel):
    canteen_name:   Optional[str] = "Main Canteen"
    canteen_id:     Optional[int] = 1
    meal_type:      str           = Field(..., description="Breakfast | Lunch | Dinner")
    food_quality:   int           = Field(..., ge=1, le=5)
    food_taste:     int           = Field(..., ge=1, le=5)
    food_hygiene:   int           = Field(..., ge=1, le=5)
    staff_behavior: int           = Field(..., ge=1, le=5)
    cleanliness:    int           = Field(..., ge=1, le=5)
    comments:       Optional[str] = None

    @validator("meal_type")
    def validate_meal_type(cls, v):
        allowed = {"Breakfast", "Lunch", "Dinner"}
        if v not in allowed:
            raise ValueError(f"meal_type must be one of {allowed}")
        return v

    @validator("comments")
    def clean_comments(cls, v):
        if v:
            v = strip_emojis(v.strip())
            if len(v) > 500:
                v = v[:500]
        return v or None

    @validator("canteen_name")
    def clean_canteen_name(cls, v):
        return strip_emojis(v) if v else v


# ─────────────────────────────────────────────
# Response schema — returned to admin/export
# Includes feedback_date and created_at
# ─────────────────────────────────────────────
class FeedbackResponse(BaseModel):
    id:             int
    canteen_id:     Optional[int]
    canteen_name:   Optional[str]
    meal_type:      str
    food_quality:   int
    food_taste:     int
    food_hygiene:   int
    staff_behavior: int
    cleanliness:    int
    comments:       Optional[str]
    feedback_date:  Optional[date]
    created_at:     Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Public list schema — hides date fields from web UI
# ─────────────────────────────────────────────
class FeedbackPublic(BaseModel):
    id:             int
    canteen_name:   Optional[str]
    meal_type:      str
    food_quality:   int
    food_taste:     int
    food_hygiene:   int
    staff_behavior: int
    cleanliness:    int
    comments:       Optional[str]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Summary schema — for dashboard stats
# ─────────────────────────────────────────────
class SummaryResponse(BaseModel):
    avg_food_quality:   float
    avg_food_taste:     float
    avg_food_hygiene:   float
    avg_staff_behavior: float
    avg_cleanliness:    float
    total_count:        int
    meal_type_filter:   Optional[str] = None
    canteen_filter:     Optional[str] = None


# ─────────────────────────────────────────────
# Generic success response
# ─────────────────────────────────────────────
class SuccessResponse(BaseModel):
    message: str

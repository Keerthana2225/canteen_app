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
    staff_behavior: int           = Field(..., ge=1, le=5)
    cleanliness:    int           = Field(..., ge=1, le=5)
    comments:       Optional[str] = None

    @validator("meal_type")
    def validate_meal_type(cls, v):
        if v not in ALLOWED_MEAL_TYPES:
            raise ValueError(f"meal_type must be one of {ALLOWED_MEAL_TYPES}")
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

    # Old validation logic (disabled)
    # Enforced comment when ANY individual rating was ≤ 2 (Poor / Below Average).
    # Kept here for reference so it can be re-enabled if needed.
    # @validator("comments", always=True)
    # def comment_required_for_low_ratings(cls, v, values):
    #     """
    #     If ANY individual rating equals 1 or 2, a comment is mandatory.
    #     This was enforced both client-side (mobile app) and server-side here.
    #     """
    #     rating_fields = ["food_quality", "food_taste", "food_hygiene", "staff_behavior", "cleanliness"]
    #     any_low_rating = any(values.get(f, 5) <= 2 for f in rating_fields)
    #     if any_low_rating and not v:
    #         raise ValueError("A comment is required when any rating is 1 or 2 (Poor/Below Average).")
    #     return v

    # New validation logic (disabled) — comment mandatory when overall avg ≤ 2
    # Re-enable in future by un-commenting the block below.
    # @validator("comments", always=True)
    # def comment_required_for_low_overall_rating(cls, v, values):
    #     """
    #     A comment is mandatory ONLY when the overall average rating (mean of all 5
    #     individual ratings) is ≤ 2.  Individual low ratings alone no longer trigger
    #     this requirement.
    #     """
    #     rating_fields = ["food_quality", "food_taste", "food_hygiene", "staff_behavior", "cleanliness"]
    #     individual_ratings = [values.get(f) for f in rating_fields if values.get(f) is not None]
    #     if individual_ratings:
    #         overall_avg = sum(individual_ratings) / len(individual_ratings)
    #         if overall_avg <= 2 and not v:
    #             raise ValueError(
    #                 "A comment is required when the overall average rating is 2 or below (≤ 2)."
    #             )
    #     return v


# ─────────────────────────────────────────────
# Response schema — returned to admin/export
# Includes all fields including dates, overall_rating, is_critical
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
    overall_rating: Optional[float]
    is_critical:    Optional[int]
    comments:       Optional[str]
    feedback_date:  Optional[date]
    created_at:     Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Public list schema — for dashboard/records API
# Exposes dates for day-wise reporting
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
    overall_rating: Optional[float]
    is_critical:    Optional[int]
    comments:       Optional[str]
    feedback_date:  Optional[date]
    created_at:     Optional[datetime]

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

"""
models.py — SQLAlchemy ORM models for Canteen and Feedback tables.
Supports all 5 meal types: Breakfast, Lunch, Dinner, Midnight Supper, Early Morning Breakfast.
overall_rating and is_critical are computed on submission and stored for analytics.
"""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship, synonym
from database import Base


class Canteen(Base):
    __tablename__ = "Canteen"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    location   = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    feedbacks  = relationship("Feedback", back_populates="canteen")


# Auto-detect whether DB column is named 'cleanliness' or legacy 'hospitality'
_cleanliness_col = "cleanliness"
try:
    from database import engine
    from sqlalchemy import inspect
    insp = inspect(engine)
    cols = [c["name"].lower() for c in insp.get_columns("Feedback")]
    if "cleanliness" in cols:
        _cleanliness_col = "cleanliness"
    elif "hospitality" in cols:
        _cleanliness_col = "hospitality"
except Exception:
    _cleanliness_col = "cleanliness"


class Feedback(Base):
    __tablename__ = "Feedback"

    id             = Column(Integer,     primary_key=True, index=True)
    canteen_id     = Column(Integer,     ForeignKey("Canteen.id"), nullable=True)
    canteen_name   = Column(String(100), nullable=True)
    meal_type      = Column(String(30),  nullable=False)   # Breakfast/Lunch/Dinner/Midnight Supper/Early Morning Breakfast
    food_quality   = Column(Integer,     nullable=False)   # 1-5
    food_taste     = Column(Integer,     nullable=False)   # 1-5
    food_hygiene   = Column(Integer,     nullable=False)   # 1-5
    staff_behavior = Column(Integer,     nullable=False)   # 1-5
    today_menu     = synonym("staff_behavior")
    cleanliness    = Column(_cleanliness_col, Integer, nullable=False)   # 1-5
    hospitality    = synonym("cleanliness")
    overall_rating = Column(Float,       nullable=True)    # avg of 5 categories
    is_critical    = Column(Integer,     nullable=True, default=0)  # 1 if overall_rating < 2
    comments       = Column(String(500), nullable=True)
    feedback_date  = Column(Date,     default=date.today)
    created_at     = Column(DateTime, default=datetime.now)

    canteen = relationship("Canteen", back_populates="feedbacks")


"""
models.py — SQLAlchemy ORM models for Canteen and Feedback tables.
Supports all 5 meal types: Breakfast, Lunch, Dinner, Midnight Supper, Early Morning Breakfast.
overall_rating and is_critical are computed on submission and stored for analytics.
"""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Canteen(Base):
    __tablename__ = "Canteen"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    location   = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    feedbacks  = relationship("Feedback", back_populates="canteen")


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
    cleanliness    = Column(Integer,     nullable=False)   # 1-5
    overall_rating = Column(Float,       nullable=True)    # avg of 5 categories
    is_critical    = Column(Integer,     nullable=True, default=0)  # 1 if overall_rating < 2
    comments       = Column(String(500), nullable=True)
    feedback_date  = Column(Date,     default=date.today)
    created_at     = Column(DateTime, default=datetime.utcnow)

    canteen = relationship("Canteen", back_populates="feedbacks")

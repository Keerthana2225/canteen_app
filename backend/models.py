"""
models.py — SQLAlchemy ORM models for Canteen and Feedback tables.
These map 1-to-1 to the SQL Server schema in database\schema.sql.
"""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Unicode
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

    id             = Column(Integer,       primary_key=True, index=True)
    canteen_id     = Column(Integer,       ForeignKey("Canteen.id"), nullable=True)
    canteen_name   = Column(Unicode(100),  nullable=True)
    meal_type      = Column(Unicode(20),   nullable=False)   # Breakfast/Lunch/Dinner
    food_quality   = Column(Integer,       nullable=False)   # 1-5
    food_taste     = Column(Integer,       nullable=False)   # 1-5
    food_hygiene   = Column(Integer,       nullable=False)   # 1-5
    staff_behavior = Column(Integer,       nullable=False)   # 1-5
    cleanliness    = Column(Integer,       nullable=False)   # 1-5
    comments       = Column(Unicode(500),  nullable=True)
    feedback_date  = Column(Date,     default=date.today)      # hidden in UI
    created_at     = Column(DateTime, default=datetime.utcnow) # hidden in UI

    canteen = relationship("Canteen", back_populates="feedbacks")

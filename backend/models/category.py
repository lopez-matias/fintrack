from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    type = Column(String(10), nullable=False)
    color = Column(String(7), default="#6366f1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
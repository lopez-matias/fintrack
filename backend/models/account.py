from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from backend.database import Base
 
 
class Account(Base):
    __tablename__ = "accounts"
 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # "cash", "card", "credit", "savings"
    initial_balance = Column(Float, default=0.0, nullable=False)
    color = Column(String(7), default="#eba80b")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
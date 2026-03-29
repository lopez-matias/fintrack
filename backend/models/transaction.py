from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base
 
class Transaction(Base):
    __tablename__ = "transactions"
 
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(10), nullable=False)  # "income" o "expense"
    description = Column(String(200))
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    category = relationship("Category", backref="transactions")
 
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    account = relationship("Account", backref="transactions")
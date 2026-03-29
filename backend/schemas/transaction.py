from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from backend.schemas.category import CategoryResponse

class TransactionBase(BaseModel):
    amount: float
    type: str  # "income" o "expense"
    description: Optional[str] = None
    category_id: int
    date: Optional[datetime] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v):
        if v not in ["income", "expense"]:
            raise ValueError("El tipo debe ser 'income' o 'expense'")
        return v

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    date: Optional[datetime] = None

class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    category: CategoryResponse

    class Config:
        from_attributes = True
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
 
 
class AccountBase(BaseModel):
    name: str
    type: str  # "cash", "card", "credit", "savings"
    initial_balance: float = 0.0
    color: str = "#7c6ff7"
 
    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v):
        if v not in ["cash", "card", "credit", "savings"]:
            raise ValueError("Tipo de cuenta inválido")
        return v
 
 
class AccountCreate(AccountBase):
    pass
 
 
class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    initial_balance: Optional[float] = None
    color: Optional[str] = None
 
 
class AccountResponse(AccountBase):
    id: int
    balance: float  # initial_balance +/- transacciones reales
    created_at: datetime
 
    class Config:
        from_attributes = True
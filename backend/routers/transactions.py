from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.database import get_db
from backend.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from backend.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    type: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    return transaction_service.get_transactions(
        db, skip=skip, limit=limit,
        type=type, category_id=category_id,
        month=month, year=year
    )

@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    return transaction_service.create_transaction(db, transaction)

@router.get("/summary", response_model=dict)
def get_monthly_summary(
    year: int = Query(datetime.now().year),
    month: int = Query(datetime.now().month),
    db: Session = Depends(get_db)
):
    return transaction_service.get_monthly_summary(db, year, month)

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = transaction_service.get_transaction(db, transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return db_transaction

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, transaction: TransactionUpdate, db: Session = Depends(get_db)):
    db_transaction = transaction_service.update_transaction(db, transaction_id, transaction)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return db_transaction

@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = transaction_service.delete_transaction(db, transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
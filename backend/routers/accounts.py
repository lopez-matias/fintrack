from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from backend.services import account_service
 
router = APIRouter(prefix="/accounts", tags=["accounts"])
 
 
@router.get("/", response_model=List[AccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    return account_service.get_accounts(db)
 
 
@router.post("/", response_model=AccountResponse, status_code=201)
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    return account_service.create_account(db, account)
 
 
@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = account_service.get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return account
 
 
@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account: AccountUpdate, db: Session = Depends(get_db)):
    updated = account_service.update_account(db, account_id, account)
    if not updated:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return updated
 
 
@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    deleted = account_service.delete_account(db, account_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
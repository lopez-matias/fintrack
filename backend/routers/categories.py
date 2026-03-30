from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from backend.database import get_db
from backend.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from backend.services import transaction_service

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return transaction_service.get_categories(db)

@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    try:
        return transaction_service.create_category(db, category)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    db_category = transaction_service.get_category(db, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return db_category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    try:
        db_category = transaction_service.update_category(db, category_id, category)
        if not db_category:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        return db_category
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")

@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.exc import IntegrityError
    db_category = transaction_service.get_category(db, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    from backend.models.transaction import Transaction
    tx_count = db.query(Transaction).filter(Transaction.category_id == category_id).count()
    if tx_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No podés eliminar esta categoría porque tiene {tx_count} transacción/es asociada/s"
        )
    try:
        transaction_service.delete_category(db, category_id)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Esta categoría tiene transacciones asociadas")
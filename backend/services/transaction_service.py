from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from typing import Optional
from backend.models.transaction import Transaction
from backend.models.category import Category
from backend.schemas.transaction import TransactionCreate, TransactionUpdate

def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = None,
    category_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    query = db.query(Transaction)

    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if month:
        query = query.filter(extract("month", Transaction.date) == month)
    if year:
        query = query.filter(extract("year", Transaction.date) == year)

    return query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()

def get_transaction(db: Session, transaction_id: int):
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()

def create_transaction(db: Session, transaction: TransactionCreate):
    db_transaction = Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_transaction(db: Session, transaction_id: int, transaction: TransactionUpdate):
    db_transaction = get_transaction(db, transaction_id)
    if not db_transaction:
        return None
    update_data = transaction.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int):
    db_transaction = get_transaction(db, transaction_id)
    if not db_transaction:
        return None
    db.delete(db_transaction)
    db.commit()
    return db_transaction

def get_monthly_summary(db: Session, year: int, month: int):
    transactions = get_transactions(db, month=month, year=year, limit=10000)

    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = total_income - total_expense

    by_category = {}
    for t in transactions:
        cat_name = t.category.name
        if cat_name not in by_category:
            by_category[cat_name] = {"income": 0, "expense": 0, "color": t.category.color}
        by_category[cat_name][t.type] += t.amount

    return {
        "year": year,
        "month": month,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": round(balance, 2),
        "by_category": by_category
    }

def get_categories(db: Session):
    return db.query(Category).all()

def get_category(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()

def create_category(db: Session, category):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category):
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    update_data = category.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    db.delete(db_category)
    db.commit()
    return db_category
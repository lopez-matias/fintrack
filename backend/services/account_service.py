from sqlalchemy.orm import Session
from backend.models.account import Account
from backend.models.transaction import Transaction
from backend.schemas.account import AccountCreate, AccountUpdate
 
 
def _compute_balance(db: Session, account: Account) -> float:
    """Calcula el balance real: saldo inicial + ingresos - gastos de sus transacciones."""
    txs = db.query(Transaction).filter(Transaction.account_id == account.id).all()
    delta = sum(t.amount if t.type == "income" else -t.amount for t in txs)
    return round(account.initial_balance + delta, 2)
 
 
def _with_balance(db: Session, account: Account) -> Account:
    account.balance = _compute_balance(db, account)
    return account
 
 
def get_accounts(db: Session):
    accounts = db.query(Account).order_by(Account.created_at).all()
    for a in accounts:
        a.balance = _compute_balance(db, a)
    return accounts
 
 
def get_account(db: Session, account_id: int):
    account = db.query(Account).filter(Account.id == account_id).first()
    if account:
        account.balance = _compute_balance(db, account)
    return account
 
 
def create_account(db: Session, data: AccountCreate) -> Account:
    account = Account(**data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    account.balance = account.initial_balance
    return account
 
 
def update_account(db: Session, account_id: int, data: AccountUpdate):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    account.balance = _compute_balance(db, account)
    return account
 
 
def delete_account(db: Session, account_id: int):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return None
    db.delete(account)
    db.commit()
    return account
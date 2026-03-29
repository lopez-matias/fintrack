from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, UserUpdate
from backend.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    token = authorization.split(" ")[1]
    payload = auth_service.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = db.query(auth_service.User).filter(auth_service.User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    try:
        user = auth_service.create_user(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = auth_service.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = auth_service.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if data.email and data.email != current_user.email:
        if auth_service.get_user_by_email(db, data.email):
            raise HTTPException(status_code=400, detail="Ese email ya está en uso")
    updated = auth_service.update_user(db, current_user, data)
    return updated

@router.put("/me/password")
def change_password(data: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current = data.get("current_password")
    new = data.get("new_password")
    if not current or not new:
        raise HTTPException(status_code=400, detail="Faltan campos")
    if not auth_service.verify_password(current, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if len(new) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    try:
        auth_service.change_password(db, current_user, new)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Contraseña actualizada correctamente"}

@router.delete("/me")
def delete_account(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    auth_service.delete_user(db, current_user)
    return {"message": "Cuenta eliminada"}
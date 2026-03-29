import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import engine, Base
from backend.models import category, account, transaction, user

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinTrack API",
    description="API para gestión de finanzas personales",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers import transactions, categories, accounts, auth
app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")

app.mount("/", StaticFiles(
    directory=os.path.join(os.path.dirname(__file__), "..", "frontend"),
    html=True
), name="frontend")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FinTrack API corriendo"}
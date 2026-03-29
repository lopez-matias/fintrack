# FinTrack 💰

Personal finance web app to track income, expenses and analyze spending habits.

Built with **Python + FastAPI** on the backend and **vanilla JS** on the frontend.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Export:** OpenPyXL (Excel), ReportLab (PDF)

## Features

- ✅ Income and expense tracking
- ✅ Category management with custom colors
- ✅ Monthly summary and balance
- ✅ Filtering by category, type, month and year
- 🔄 Analytics dashboard with charts (in progress)
- 🔄 Export to Excel and PDF (in progress)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/lopez-matias/fintrack.git
cd fintrack

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn backend.main:app --reload
```

Open http://127.0.0.1:8000/docs to explore the API.

## Project Structure

```
fintrack/
├── backend/
│   ├── models/        # Database models
│   ├── routers/       # API endpoints
│   ├── schemas/       # Pydantic validators
│   ├── services/      # Business logic
│   ├── database.py    # DB connection
│   └── main.py        # App entry point
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
└── requirements.txt
```

## API Endpoints

| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | /api/categories           | List all categories |
| POST   | /api/categories           | Create category     |
| GET    | /api/transactions         | List transactions   |
| POST   | /api/transactions         | Create transaction  |
| GET    | /api/transactions/summary | Monthly summary     |

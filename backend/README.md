# Django Backend (Supabase Postgres)

## 1. Create virtual environment and install deps

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Set `SUPABASE_DB_URL` in `.env` using the Supabase Postgres connection string.

## 3. Run migrations

```powershell
.\.venv\Scripts\python manage.py migrate
```

## 4. Start backend

```powershell
.\.venv\Scripts\python manage.py runserver
```

Health check endpoint:

`GET http://127.0.0.1:8000/api/health/`

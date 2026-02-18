# GearGuards

Full-stack setup:
- Frontend: React + Vite (`frontend/`)
- Backend: Django + DRF (`backend/`)
- Database: Supabase Postgres
- Auth: Token auth with role approval workflow

## Prerequisites

- Node.js 18+ and npm
- Python 3.12+ (or your installed Python version)
- Supabase project with Postgres connection URI

## Backend Setup (Django + Supabase)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set:

```env
SUPABASE_DB_URL=postgresql://<user>:<password>@<host>:<port>/postgres?sslmode=require
```

Run migrations and start backend:

```powershell
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver
```

Backend health check:
- `http://127.0.0.1:8000/api/health/`

## Roles and Approval Flow

Roles implemented:
- `ADMIN` (management)
- `USER` (borrower: personnel/student)
- `HANDLER` (can handle borrowing operations if admin is unavailable)

Registration/login flow:
1. User registers from frontend `/register`.
2. Account stays pending until approved by an Admin.
3. Main admin logs in and approves registration from `/admin/approvals`, assigning role.
4. Approved user can then log in from `/login`.

Create main admin (first time):

```powershell
cd backend
.\.venv\Scripts\python manage.py createsuperuser
```

Main auth endpoints:
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `GET /api/admin/pending/` (admin only)
- `POST /api/admin/approve/<user_id>/` (admin only)
- `POST /api/admin/reject/<user_id>/` (admin only)

## Frontend Setup (React + Vite)

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend dev URL:
- `http://localhost:5173`

Frontend auth pages:
- `/login`
- `/register`
- `/admin/approvals` (admin management page)

## Run Both Services

1. Terminal 1: run Django backend on `127.0.0.1:8000`
2. Terminal 2: run Vite frontend on `localhost:5173`

## Notes

- Keep secrets in `backend/.env` only. Do not commit `.env`.
- If Supabase direct connection fails on your network, use the Supabase pooler URI instead.




SAMPLE ACCOUNTS

admin1 (Admin) - password: AdminPass123!
handler1 (User Handler) - password: HandlerPass123!
student1 (Borrower/Student) - password: StudentPass123!
personnel1 (Borrower/Personnel) - password: PersonnelPass123!   
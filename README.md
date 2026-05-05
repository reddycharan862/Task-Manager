# Task Manager

A full-stack Task Manager application built with **FastAPI** (backend) and plain **HTML/CSS/JS** (frontend). Features JWT authentication, SQLite persistence, pagination, and filtering.

## Live Demo

> **[https://your-app.onrender.com](https://task-manager-fc2d.onrender.com)**  
> API Docs: **[https://your-app.onrender.com](https://task-manager-fc2d.onrender.com/docs)**



## Tech Stack

Layer         |     Technology
-------------------------------------------------------
Backend       =     FastAPI, SQLAlchemy, Pydantic v2
Auth          =     JWT (python-jose), bcrypt (passlib)
Database      =     SQLite (dev) / PostgreSQL (prod)
Frontend      =     HTML, CSS, Vanilla JavaScript
Testing       =     Pytest, HTTPX
Deploy        =     Render / Docker



##  Project Structure


task-manager/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app + CORS + static files
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # User & Task ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── auth.py          # JWT & bcrypt helpers
│   │   ├── dependencies.py  # get_current_user dependency
│   │   └── routers/
│   │       ├── auth.py      # POST /register, POST /login
│   │       └── tasks.py     # CRUD /tasks endpoints
│   ├── tests/
│   │   └── test_api.py      # 15+ pytest test cases
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── .env                 # ← NOT committed
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── docker-compose.yml
└── README.md



## Environment Variables

Copy `.env.example` to `.env` and fill in values:

cp backend/.env.example backend/.env

Variable                    |    Description                              |    Example             
---------------------------------------------------------------------------------------------------
SECRET_KEY                  |    JWT signing key (keep secret!)           |    openssl rand -hex 32 
ALGORITHM                   |    JWT algorithm                            |    HS256 
ACCESS_TOKEN_EXPIRE_MINUTES |    Token lifetime in minutes                |    30 
DATABASE_URL                |    SQLAlchemy DB connection string          |    sqlite:///./tasks.db


## Run Locally

### Option A – Python (recommended for dev)

# 1. Clone
git clone https://github.com/YOUR_USERNAME/task-manager.git
cd task-manager

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env and set your SECRET_KEY

# 5. Start the server (from repo root)
cd backend
uvicorn app.main:app --reload --port 8000

Open **http://localhost:8000** → Frontend  
Open **http://localhost:8000/docs** → Swagger UI



### Option B – Docker Compose

cp backend/.env.example backend/.env
# Edit backend/.env
docker-compose up --build
Open **http://localhost:8000**



## Running Tests

cd backend
pytest tests/ -v

Expected output: **15+ tests passing** 



## API Endpoints

### Authentication

Method |   Endpoint    |   Description            | Auth Required
-----------------------------------------------------------------
POST   |   /register   |   Register new user      | NO
POST   |   /login      |   Login → receive JWT    | No

### Tasks

Method |    Endpoint       |    Description                        |    Auth Required 
-------------------------------------------------------------------------------------
POST   |    /tasks         |    Create a new task                  |    Yes
GET    |    /tasks         |    Get all tasks (paginated/filtered) |    Yes
GET    |    /tasks/{id}    |    Get a specific task                |    Yes
PUT    |    /tasks/{id}    |    Update task (title/desc/complete)  |    Yes
DELETE |    /tasks/{id}    |    Delete a task                      |    Yes

**Query Parameters for GET /tasks:**
- `page` (int, default: 1)
- `page_size` (int, default: 8, max: 100)
- `completed` (bool: `true` / `false`)



## Deploy to Render

1. Push this repo to GitHub (public)
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from your `.env`
6. Click **Deploy**
frontend is served automatically from the same service (FastAPI mounts the `frontend/` folder as static files).


## Security Notes

- Passwords are hashed with **bcrypt** (never stored in plain text)
- JWT tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES`
- Users can **only access their own tasks** (enforced server-side)
- `.env` is in `.gitignore` — secrets are never committed


## License

MIT

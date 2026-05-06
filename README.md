Task Manager
A simple Task Manager web application built with Python, FastAPI(backend) and plain HTML, CSS, and JavaScript(Frontend). Users can register, login, and manage their personal tasks.

Live Demo

App: https://task-manager-fc2d.onrender.com
API Docs: https://task-manager-fc2d.onrender.com/docs


Tech Stack
Backend is built with FastAPI, SQLAlchemy, and SQLite database.
Authentication is handled using JWT tokens and bcrypt for password hashing.
Frontend is plain HTML, CSS, and JavaScript.
Tests are written using Pytest.

Project Structure
The project is divided into two main folders. The backend folder contains the FastAPI application with all routes, models, schemas, and database logic. The frontend folder contains the HTML, CSS, and JavaScript files for the user interface.

Environment Variables
Copy .env.example to .env and fill in the values:
bashcp backend/.env.example backend/.env
VariableDescriptionExampleSECRET_KEYJWT signing key (keep secret!)openssl rand -hex 32ALGORITHMJWT algorithmHS256ACCESS_TOKEN_EXPIRE_MINUTESToken lifetime in minutes30DATABASE_URLSQLAlchemy DB connection stringsqlite:///./tasks.db

Run Locally
Option A — Python (Recommended for Development)
# 1. Clone the repository
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

# 5. Start the server
cd backend
uvicorn app.main:app --reload --port 8000

Frontend → http://localhost:8000
Swagger UI → http://localhost:8000/docs


Option B — Docker Compose
bashcp backend/.env.example backend/.env
# Edit backend/.env and set your SECRET_KEY

docker-compose up --build
Open http://localhost:8000

Running Tests
bashcd backend
pytest tests/ -v
Expected output: 15+ tests passing 

API Endpoints
POST /register is used to create a new user account.
POST /login is used to login and receive a JWT token.
POST /tasks is used to create a new task.
GET /tasks is used to get all tasks with optional pagination and filtering.
GET /tasks/{id} is used to get a specific task by its ID.
PUT /tasks/{id} is used to update a task or mark it as completed.
DELETE /tasks/{id} is used to delete a task.

Deployment

The application is deployed on Render. The backend serves both the API and the frontend static files from the same service.


Security Notes
The .env file is not committed to GitHub for security reasons. A .env.example file is included to show what variables are needed. Secrets are never hardcoded in the source code.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .database import Base, engine
from .routers import auth as auth_router
from .routers import tasks as tasks_router

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Manager API",
    description="A simple Task Manager with JWT authentication",
    version="1.0.0",
)

# CORS – allow all origins (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(tasks_router.router)

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "../../frontend")

if os.path.isdir(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

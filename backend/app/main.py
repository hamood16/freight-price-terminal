"""Right now this is just an endpoint to show that the backend API is alive and running.
This is used in real software development and systems for monitoring, cloud checks, etc.
That is what the /health is for below to chech FastAPI status."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.routes import router as routes_router

app = FastAPI(title="Freight Route Price Terminal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(routes_router)

@app.get("/health")
def health_check():
    return{"status": "ok"}

"""Right now this is just an endpoint to show that the backend API is alive and running.
This is used in real software development and systems for monitoring, cloud checks, etc.
That is what the /health is for below to chech FastAPI status."""

from fastapi import FastAPI

app = FastAPI(title="Freight Route Price Terminal API")

@app.get("/health")
def health_check():
    return{"status": "ok"}


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.planets import router as planets_router
from app.routes.compare import router as compare_router
app = FastAPI(
    title="ExoVerse API",
    description="NASA Exoplanet Explorer Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(planets_router)
app.include_router(compare_router)

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "ExoVerse backend is running"
    }

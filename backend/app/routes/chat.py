
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.services.ai_service import ask_astronomer

router = APIRouter(
    prefix="/api",
    tags=["AI Astronomer"]
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    planet_data: dict = Field(default_factory=dict)


@router.post("/chat")
async def chat_with_astronomer(request: ChatRequest):

    if not request.planet_data:
        raise HTTPException(
            status_code=400,
            detail="Planet data is required."
        )

    try:
        answer = await run_in_threadpool(
            ask_astronomer,
            request.question,
            request.planet_data
        )

        return {
            "answer": answer,
            "sources": ["NASA Exoplanet Archive"]
        }

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unable to get a response from the AI service."
        )

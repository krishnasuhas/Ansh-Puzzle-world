from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated
from bson import ObjectId
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Ansh's Puzzle World API")
api_router = APIRouter(prefix="/api")


# ---- Mongo helpers ----
def _validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---- Models ----
class ScoreCreate(BaseModel):
    grid: int
    mode: str            # "relaxed" | "timed"
    photo_id: str
    moves: int
    time_seconds: int


class Score(BaseModel):
    id: PyObjectId = Field(alias="_id")
    grid: int
    mode: str
    photo_id: str
    moves: int
    time_seconds: int
    created_at: str

    class Config:
        populate_by_name = True


class BestScore(BaseModel):
    grid: int
    mode: str
    best_moves: Optional[int] = None
    best_time_seconds: Optional[int] = None
    plays: int = 0


@api_router.get("/")
async def root():
    return {"message": "Ansh's Puzzle World API is running"}


@api_router.post("/scores", response_model=Score)
async def create_score(payload: ScoreCreate):
    doc = payload.model_dump()
    doc["created_at"] = _now_iso()
    result = await db.scores.insert_one(doc)
    doc["_id"] = result.inserted_id
    return Score(**doc)


@api_router.get("/scores/best", response_model=BestScore)
async def best_score(grid: int = Query(...), mode: str = Query(...)):
    cursor = db.scores.find({"grid": grid, "mode": mode})
    scores = await cursor.to_list(2000)
    if not scores:
        return BestScore(grid=grid, mode=mode)
    best_moves = min(s["moves"] for s in scores)
    best_time = min(s["time_seconds"] for s in scores)
    return BestScore(
        grid=grid,
        mode=mode,
        best_moves=best_moves,
        best_time_seconds=best_time,
        plays=len(scores),
    )


@api_router.get("/scores/recent", response_model=List[Score])
async def recent_scores(limit: int = 10):
    cursor = db.scores.find().sort("created_at", -1).limit(limit)
    scores = await cursor.to_list(limit)
    return [Score(**s) for s in scores]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

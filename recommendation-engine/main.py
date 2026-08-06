from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from recommender import train_model, get_recommendations

app = FastAPI(title="Intasela Recommendation Engine")

@app.on_event("startup")
async def startup_event():
    # Train the model asynchronously in the background on startup
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, train_model)
    
    # Start periodic training task
    asyncio.create_task(periodic_training(300)) # Train every 5 minutes

async def periodic_training(interval_seconds: int):
    while True:
        await asyncio.sleep(interval_seconds)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, train_model)

class RecommendRequest(BaseModel):
    user_id: Optional[str] = None
    interests: Optional[List[str]] = None
    exclude_ids: Optional[List[int]] = None
    type: Optional[str] = "for-you"
    limit: int = 20

@app.get("/")
def read_root():
    return {"message": "Intasela Recommendation Engine API (Phase 2 - ML Enabled)"}

@app.post("/recommend")
def recommend_feed(req: RecommendRequest):
    recommended_ids = []
    
    if req.user_id:
        # Get Collaborative & Content-Based recommendations
        recommended_ids = get_recommendations(
            user_id=req.user_id, 
            limit=req.limit, 
            feed_type=req.type or 'for-you',
            user_interests=req.interests or []
        )
    
    # Cold Start fallback: If no IDs were returned but we have interests
    if not recommended_ids and req.interests:
        recommended_ids = get_recommendations(
            user_id=req.user_id, 
            limit=req.limit, 
            feed_type=req.type or 'for-you',
            user_interests=req.interests
        )
        
    return {
        "status": "success",
        "post_ids": [int(x) for x in recommended_ids]
    }


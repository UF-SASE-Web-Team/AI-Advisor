from fastapi import FastAPI
from pydantic import BaseModel

class UserPreference(BaseModel):
    x: int
    y: int
    z: int
    min_credits: int
    max_credits: int

    blacklisted_periods: dict[str, list[int]]

app = FastAPI()

@app.get("/health")
def health():
    return "ok"

@app.post("/solve/")
async def solve(preference: UserPreference):
    # Placeholder for solver logic
    return {
        "status": "success",
        "data": {
            "scheduled_courses": [],
            "total_credits": 0
        }
    }
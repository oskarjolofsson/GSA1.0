# app/main.py
from fastapi import FastAPI
from app.api import videos, analysis, profiles

app = FastAPI(title="Golf Analyzer API")

app.include_router(videos.router, prefix="/videos", tags=["videos"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])

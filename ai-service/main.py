from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import matching, recommendations, fraud, skills

app = FastAPI(
    title="GigaConnect AI Service",
    description="AI-powered matching, recommendations, and fraud detection",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(matching.router, prefix="/api/matching", tags=["Matching"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(fraud.router, prefix="/api/fraud", tags=["Fraud Detection"])
app.include_router(skills.router, prefix="/api/skills", tags=["Skills"])


@app.get("/")
async def root():
    return {"message": "GigaConnect AI Service", "status": "healthy"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

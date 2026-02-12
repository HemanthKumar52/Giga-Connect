from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from ..services.recommendation_service import RecommendationService
from ..models.schemas import PriceRecommendation, ProposalQuality

router = APIRouter()
recommendation_service = RecommendationService()


class PriceRequest(BaseModel):
    job_description: str
    required_skills: List[str]
    experience_level: str  # entry, intermediate, expert
    similar_jobs_data: Optional[List[dict]] = None


class ProposalQualityRequest(BaseModel):
    proposal_text: str
    job_description: str
    required_skills: List[str]


class ResumeRequest(BaseModel):
    skills: List[str]
    experience_years: int
    completed_jobs: int
    avg_rating: float
    bio: Optional[str] = None


@router.post("/price", response_model=PriceRecommendation)
async def recommend_price(request: PriceRequest):
    """Get price recommendation for a job"""
    try:
        recommendation = recommendation_service.recommend_price(
            job_description=request.job_description,
            required_skills=request.required_skills,
            experience_level=request.experience_level,
            similar_jobs_data=request.similar_jobs_data
        )
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proposal-quality", response_model=ProposalQuality)
async def analyze_proposal(request: ProposalQualityRequest):
    """Analyze proposal quality"""
    try:
        quality = recommendation_service.analyze_proposal_quality(
            proposal_text=request.proposal_text,
            job_description=request.job_description,
            required_skills=request.required_skills
        )
        return quality
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume-summary")
async def generate_resume(request: ResumeRequest):
    """Generate AI resume summary"""
    try:
        summary = recommendation_service.generate_resume_summary(
            skills=request.skills,
            experience_years=request.experience_years,
            completed_jobs=request.completed_jobs,
            avg_rating=request.avg_rating,
            bio=request.bio
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

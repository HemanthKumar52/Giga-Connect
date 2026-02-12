from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from ..services.matching_service import MatchingService
from ..models.schemas import FreelancerProfile, FreelancerMatch, JobMatch

router = APIRouter()
matching_service = MatchingService()


class MatchFreelancersRequest(BaseModel):
    job_description: str
    required_skills: List[str]
    freelancers: List[FreelancerProfile]
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    limit: int = 20


class MatchJobsRequest(BaseModel):
    freelancer_skills: List[str]
    freelancer_bio: str
    jobs: List[dict]
    preferred_rate: Optional[float] = None
    limit: int = 20


@router.post("/freelancers", response_model=List[FreelancerMatch])
async def match_freelancers(request: MatchFreelancersRequest):
    """Match freelancers to a job posting"""
    try:
        matches = matching_service.match_freelancers_to_job(
            job_description=request.job_description,
            required_skills=request.required_skills,
            freelancers=request.freelancers,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            limit=request.limit
        )
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs", response_model=List[JobMatch])
async def match_jobs(request: MatchJobsRequest):
    """Match jobs to a freelancer"""
    try:
        matches = matching_service.match_jobs_to_freelancer(
            freelancer_skills=request.freelancer_skills,
            freelancer_bio=request.freelancer_bio,
            jobs=request.jobs,
            preferred_rate=request.preferred_rate,
            limit=request.limit
        )
        return matches
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

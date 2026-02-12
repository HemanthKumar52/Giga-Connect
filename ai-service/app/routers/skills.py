from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from ..services.skills_service import SkillsService
from ..models.schemas import SkillAnalysis

router = APIRouter()
skills_service = SkillsService()


class ExtractSkillsRequest(BaseModel):
    text: str


class RelatedSkillsRequest(BaseModel):
    skills: List[str]
    limit: int = 10


class ValidateSkillsRequest(BaseModel):
    skills: List[str]


@router.post("/extract", response_model=SkillAnalysis)
async def extract_skills(request: ExtractSkillsRequest):
    """Extract skills from text"""
    try:
        analysis = skills_service.extract_skills(text=request.text)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/related")
async def get_related_skills(request: RelatedSkillsRequest):
    """Get related skills based on input skills"""
    try:
        related = skills_service.get_related_skills(
            skills=request.skills,
            limit=request.limit
        )
        return {"related_skills": related}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_skills(request: ValidateSkillsRequest):
    """Validate and standardize skill names"""
    try:
        result = skills_service.validate_skills(skills=request.skills)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

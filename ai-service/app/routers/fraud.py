from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.fraud_service import FraudDetectionService
from ..models.schemas import FraudRisk

router = APIRouter()
fraud_service = FraudDetectionService()


class UserRiskRequest(BaseModel):
    user_data: dict
    activity_data: Optional[dict] = None


class JobRiskRequest(BaseModel):
    job_data: dict


class ProposalRiskRequest(BaseModel):
    proposal_data: dict


@router.post("/user", response_model=FraudRisk)
async def analyze_user_risk(request: UserRiskRequest):
    """Analyze fraud risk for a user"""
    try:
        risk = fraud_service.analyze_user_risk(
            user_data=request.user_data,
            activity_data=request.activity_data
        )
        return risk
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/job", response_model=FraudRisk)
async def analyze_job_risk(request: JobRiskRequest):
    """Analyze fraud risk for a job posting"""
    try:
        risk = fraud_service.analyze_job_posting(job_data=request.job_data)
        return risk
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proposal", response_model=FraudRisk)
async def analyze_proposal_risk(request: ProposalRiskRequest):
    """Analyze fraud risk for a proposal"""
    try:
        risk = fraud_service.analyze_proposal(proposal_data=request.proposal_data)
        return risk
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

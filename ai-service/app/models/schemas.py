from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class SkillMatch(BaseModel):
    skill: str
    score: float


class FreelancerMatch(BaseModel):
    freelancer_id: str
    name: str
    match_score: float
    skill_match: float
    experience_match: float
    rate_match: float
    skills: List[str]


class JobMatch(BaseModel):
    job_id: str
    title: str
    match_score: float
    skill_match: float
    budget_match: float
    skills: List[str]


class MatchRequest(BaseModel):
    job_id: str
    title: str
    description: str
    required_skills: List[str]
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    experience_level: Optional[str] = None
    limit: int = 20


class FreelancerProfile(BaseModel):
    user_id: str
    name: str
    skills: List[str]
    hourly_rate: Optional[float] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    completed_jobs: int = 0
    avg_rating: float = 0.0


class JobForMatching(BaseModel):
    job_id: str
    title: str
    description: str
    skills: List[str]
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None


class PriceRecommendation(BaseModel):
    recommended_price: float
    price_range_min: float
    price_range_max: float
    confidence: float
    factors: dict


class ProposalQuality(BaseModel):
    score: float
    feedback: List[str]
    suggestions: List[str]


class FraudRisk(BaseModel):
    risk_score: float
    risk_level: str  # low, medium, high
    flags: List[str]
    recommendation: str


class SkillAnalysis(BaseModel):
    extracted_skills: List[str]
    skill_categories: dict
    confidence_scores: dict


class ResumeData(BaseModel):
    text: str
    job_title: Optional[str] = None
    skills: Optional[List[str]] = None


class GeneratedResume(BaseModel):
    summary: str
    skills_section: str
    experience_highlights: List[str]

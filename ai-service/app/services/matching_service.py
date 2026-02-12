from typing import List, Dict, Any, Optional
import numpy as np
from .embedding_service import get_embedding_service
from ..models.schemas import FreelancerProfile, FreelancerMatch, JobMatch


class MatchingService:
    def __init__(self):
        self.embedding_service = get_embedding_service()

    def match_freelancers_to_job(
        self,
        job_description: str,
        required_skills: List[str],
        freelancers: List[FreelancerProfile],
        budget_min: Optional[float] = None,
        budget_max: Optional[float] = None,
        limit: int = 20
    ) -> List[FreelancerMatch]:
        """Match freelancers to a job based on skills, experience, and rate"""

        if not freelancers:
            return []

        # Create job embedding from description + skills
        job_text = f"{job_description} Skills: {', '.join(required_skills)}"
        job_embedding = self.embedding_service.encode_single(job_text)

        matches = []

        for freelancer in freelancers:
            # Create freelancer embedding
            freelancer_text = f"{freelancer.bio or ''} Skills: {', '.join(freelancer.skills)}"
            freelancer_embedding = self.embedding_service.encode_single(freelancer_text)

            # Calculate skill match
            skill_match = self._calculate_skill_match(required_skills, freelancer.skills)

            # Calculate semantic similarity
            semantic_score = self.embedding_service.similarity(job_embedding, freelancer_embedding)

            # Calculate rate match
            rate_match = self._calculate_rate_match(
                freelancer.hourly_rate, budget_min, budget_max
            )

            # Experience bonus
            exp_bonus = min(freelancer.experience_years or 0, 10) / 10 * 0.1

            # Rating bonus
            rating_bonus = (freelancer.avg_rating / 5) * 0.1

            # Calculate final score
            final_score = (
                skill_match * 0.4 +
                semantic_score * 0.3 +
                rate_match * 0.15 +
                exp_bonus +
                rating_bonus
            )

            matches.append(FreelancerMatch(
                freelancer_id=freelancer.user_id,
                name=freelancer.name,
                match_score=round(final_score * 100, 2),
                skill_match=round(skill_match * 100, 2),
                experience_match=round((exp_bonus * 10) * 100, 2),
                rate_match=round(rate_match * 100, 2),
                skills=freelancer.skills
            ))

        # Sort by match score and return top matches
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:limit]

    def match_jobs_to_freelancer(
        self,
        freelancer_skills: List[str],
        freelancer_bio: str,
        jobs: List[Dict[str, Any]],
        preferred_rate: Optional[float] = None,
        limit: int = 20
    ) -> List[JobMatch]:
        """Match jobs to a freelancer based on their skills and preferences"""

        if not jobs:
            return []

        # Create freelancer embedding
        freelancer_text = f"{freelancer_bio} Skills: {', '.join(freelancer_skills)}"
        freelancer_embedding = self.embedding_service.encode_single(freelancer_text)

        matches = []

        for job in jobs:
            job_skills = job.get("skills", [])
            job_description = job.get("description", "")

            # Create job embedding
            job_text = f"{job.get('title', '')} {job_description} Skills: {', '.join(job_skills)}"
            job_embedding = self.embedding_service.encode_single(job_text)

            # Calculate skill match
            skill_match = self._calculate_skill_match(job_skills, freelancer_skills)

            # Calculate semantic similarity
            semantic_score = self.embedding_service.similarity(freelancer_embedding, job_embedding)

            # Calculate budget match
            budget_match = 1.0
            if preferred_rate and job.get("budget_max"):
                if preferred_rate <= job["budget_max"]:
                    budget_match = 1.0
                else:
                    budget_match = max(0, 1 - (preferred_rate - job["budget_max"]) / preferred_rate)

            # Final score
            final_score = skill_match * 0.5 + semantic_score * 0.35 + budget_match * 0.15

            matches.append(JobMatch(
                job_id=job["job_id"],
                title=job.get("title", ""),
                match_score=round(final_score * 100, 2),
                skill_match=round(skill_match * 100, 2),
                budget_match=round(budget_match * 100, 2),
                skills=job_skills
            ))

        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:limit]

    def _calculate_skill_match(self, required: List[str], available: List[str]) -> float:
        """Calculate skill match percentage"""
        if not required:
            return 1.0

        required_lower = set(s.lower() for s in required)
        available_lower = set(s.lower() for s in available)

        # Direct match
        direct_matches = len(required_lower & available_lower)

        # Semantic match for non-direct matches
        unmatched_required = required_lower - available_lower
        semantic_matches = 0

        if unmatched_required and available_lower:
            req_embeddings = self.embedding_service.encode(list(unmatched_required))
            avail_embeddings = self.embedding_service.encode(list(available_lower))

            for req_emb in req_embeddings:
                max_sim = max(
                    self.embedding_service.similarity(req_emb, avail_emb)
                    for avail_emb in avail_embeddings
                )
                if max_sim > 0.7:  # Threshold for semantic match
                    semantic_matches += max_sim

        total_match = direct_matches + semantic_matches
        return min(total_match / len(required), 1.0)

    def _calculate_rate_match(
        self,
        rate: Optional[float],
        budget_min: Optional[float],
        budget_max: Optional[float]
    ) -> float:
        """Calculate rate match score"""
        if rate is None:
            return 0.5  # Neutral score

        if budget_min is None and budget_max is None:
            return 1.0

        if budget_min and budget_max:
            if budget_min <= rate <= budget_max:
                return 1.0
            elif rate < budget_min:
                return max(0, 1 - (budget_min - rate) / budget_min)
            else:
                return max(0, 1 - (rate - budget_max) / budget_max)

        if budget_max:
            return 1.0 if rate <= budget_max else max(0, 1 - (rate - budget_max) / budget_max)

        if budget_min:
            return 1.0 if rate >= budget_min else max(0, rate / budget_min)

        return 0.5

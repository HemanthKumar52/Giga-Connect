from typing import List, Optional, Dict, Any
import numpy as np
from .embedding_service import get_embedding_service
from ..models.schemas import PriceRecommendation, ProposalQuality


class RecommendationService:
    def __init__(self):
        self.embedding_service = get_embedding_service()

    def recommend_price(
        self,
        job_description: str,
        required_skills: List[str],
        experience_level: str,
        similar_jobs_data: Optional[List[Dict[str, Any]]] = None
    ) -> PriceRecommendation:
        """Recommend price for a job based on similar jobs and market data"""

        # Base rates by experience level (USD/hour)
        base_rates = {
            "entry": 25,
            "intermediate": 50,
            "expert": 100
        }

        base_rate = base_rates.get(experience_level.lower(), 50)

        # Skill complexity factor
        high_value_skills = [
            "machine learning", "ai", "blockchain", "aws", "kubernetes",
            "react", "node.js", "python", "golang", "rust", "security"
        ]

        skill_factor = 1.0
        matching_skills = sum(1 for s in required_skills if any(hv in s.lower() for hv in high_value_skills))
        skill_factor += matching_skills * 0.1

        # Calculate from similar jobs if available
        if similar_jobs_data:
            prices = [j.get("price", 0) for j in similar_jobs_data if j.get("price")]
            if prices:
                market_avg = np.mean(prices)
                base_rate = (base_rate + market_avg) / 2

        # Final calculation
        recommended = base_rate * skill_factor
        range_min = recommended * 0.8
        range_max = recommended * 1.3

        return PriceRecommendation(
            recommended_price=round(recommended, 2),
            price_range_min=round(range_min, 2),
            price_range_max=round(range_max, 2),
            confidence=0.75,
            factors={
                "base_rate": base_rate,
                "skill_factor": skill_factor,
                "experience_level": experience_level
            }
        )

    def analyze_proposal_quality(
        self,
        proposal_text: str,
        job_description: str,
        required_skills: List[str]
    ) -> ProposalQuality:
        """Analyze the quality of a proposal"""

        score = 0.0
        feedback = []
        suggestions = []

        # Length check
        word_count = len(proposal_text.split())
        if word_count < 50:
            feedback.append("Proposal is too short")
            suggestions.append("Add more detail about your approach and experience")
        elif word_count > 500:
            feedback.append("Proposal might be too long")
            suggestions.append("Consider being more concise")
        else:
            score += 0.2
            feedback.append("Good proposal length")

        # Skill mention check
        mentioned_skills = sum(1 for skill in required_skills if skill.lower() in proposal_text.lower())
        skill_mention_ratio = mentioned_skills / max(len(required_skills), 1)

        if skill_mention_ratio < 0.3:
            suggestions.append("Mention more of the required skills and your experience with them")
        else:
            score += 0.2
            feedback.append("Good skill coverage")

        # Semantic relevance
        proposal_embedding = self.embedding_service.encode_single(proposal_text)
        job_embedding = self.embedding_service.encode_single(job_description)
        relevance = self.embedding_service.similarity(proposal_embedding, job_embedding)

        score += relevance * 0.4

        if relevance < 0.5:
            suggestions.append("Make your proposal more relevant to the specific job requirements")
        else:
            feedback.append("Proposal is relevant to the job")

        # Professional language indicators
        professional_terms = ["experience", "deliver", "timeline", "quality", "communication", "milestone"]
        prof_count = sum(1 for term in professional_terms if term in proposal_text.lower())

        if prof_count >= 3:
            score += 0.1
            feedback.append("Uses professional language")
        else:
            suggestions.append("Use more professional language about delivery and communication")

        # Question engagement
        if "?" in proposal_text:
            score += 0.1
            feedback.append("Shows engagement by asking questions")
        else:
            suggestions.append("Consider asking clarifying questions to show engagement")

        # Normalize score
        final_score = min(max(score, 0), 1.0)

        return ProposalQuality(
            score=round(final_score * 100, 2),
            feedback=feedback,
            suggestions=suggestions
        )

    def generate_resume_summary(
        self,
        skills: List[str],
        experience_years: int,
        completed_jobs: int,
        avg_rating: float,
        bio: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate an AI-powered resume summary"""

        skill_categories = self._categorize_skills(skills)

        # Generate summary
        level = "senior" if experience_years > 5 else "mid-level" if experience_years > 2 else "emerging"
        primary_skills = skills[:5] if skills else []

        summary = f"A {level} professional with {experience_years}+ years of experience"
        if primary_skills:
            summary += f" specializing in {', '.join(primary_skills)}"
        if completed_jobs > 0:
            summary += f". Successfully completed {completed_jobs} projects"
        if avg_rating >= 4.5:
            summary += f" with an outstanding {avg_rating}/5 rating"
        elif avg_rating >= 4.0:
            summary += f" with an excellent {avg_rating}/5 rating"
        summary += "."

        return {
            "summary": summary,
            "skills_section": self._format_skills_section(skill_categories),
            "highlights": [
                f"{experience_years}+ years of professional experience",
                f"{completed_jobs} projects completed",
                f"{avg_rating}/5 average client rating",
                f"Expert in {', '.join(primary_skills[:3])}" if primary_skills else None
            ]
        }

    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize skills by type"""
        categories = {
            "programming": [],
            "frameworks": [],
            "databases": [],
            "cloud": [],
            "tools": [],
            "soft_skills": [],
            "other": []
        }

        programming = ["python", "javascript", "typescript", "java", "c++", "go", "rust", "ruby", "php"]
        frameworks = ["react", "angular", "vue", "node", "django", "flask", "spring", "express", "next"]
        databases = ["postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb"]
        cloud = ["aws", "gcp", "azure", "docker", "kubernetes", "terraform"]

        for skill in skills:
            skill_lower = skill.lower()
            if any(p in skill_lower for p in programming):
                categories["programming"].append(skill)
            elif any(f in skill_lower for f in frameworks):
                categories["frameworks"].append(skill)
            elif any(d in skill_lower for d in databases):
                categories["databases"].append(skill)
            elif any(c in skill_lower for c in cloud):
                categories["cloud"].append(skill)
            else:
                categories["other"].append(skill)

        return {k: v for k, v in categories.items() if v}

    def _format_skills_section(self, categories: Dict[str, List[str]]) -> str:
        """Format skills section for resume"""
        sections = []
        for category, skills in categories.items():
            if skills:
                sections.append(f"{category.replace('_', ' ').title()}: {', '.join(skills)}")
        return "\n".join(sections)

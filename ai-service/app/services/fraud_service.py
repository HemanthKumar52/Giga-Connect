from typing import List, Dict, Any, Optional
import numpy as np
from ..models.schemas import FraudRisk


class FraudDetectionService:
    def __init__(self):
        self.high_risk_patterns = [
            "wire transfer",
            "western union",
            "bitcoin only",
            "payment outside platform",
            "urgent payment",
            "cryptocurrency only",
            "prepaid card",
        ]

        self.spam_patterns = [
            "click here",
            "act now",
            "limited time",
            "guaranteed income",
            "work from home",
            "easy money",
            "no experience needed",
        ]

    def analyze_user_risk(
        self,
        user_data: Dict[str, Any],
        activity_data: Optional[Dict[str, Any]] = None
    ) -> FraudRisk:
        """Analyze fraud risk for a user"""

        risk_score = 0.0
        flags = []

        # Check account age
        account_age_days = user_data.get("account_age_days", 0)
        if account_age_days < 7:
            risk_score += 0.2
            flags.append("New account (less than 7 days)")
        elif account_age_days < 30:
            risk_score += 0.1
            flags.append("Account less than 30 days old")

        # Check profile completion
        profile_completion = user_data.get("profile_completion", 0)
        if profile_completion < 50:
            risk_score += 0.15
            flags.append("Incomplete profile")

        # Check verification status
        if not user_data.get("email_verified"):
            risk_score += 0.15
            flags.append("Email not verified")

        if not user_data.get("phone_verified"):
            risk_score += 0.1
            flags.append("Phone not verified")

        # Check activity patterns
        if activity_data:
            # Multiple failed payments
            failed_payments = activity_data.get("failed_payments", 0)
            if failed_payments > 3:
                risk_score += 0.2
                flags.append(f"{failed_payments} failed payment attempts")

            # Rapid job creation
            jobs_last_24h = activity_data.get("jobs_last_24h", 0)
            if jobs_last_24h > 10:
                risk_score += 0.15
                flags.append("Unusual number of jobs posted")

            # Dispute history
            disputes = activity_data.get("disputes", 0)
            if disputes > 2:
                risk_score += 0.2
                flags.append(f"{disputes} disputes on record")

        # Check for suspicious bio content
        bio = user_data.get("bio", "")
        for pattern in self.high_risk_patterns:
            if pattern.lower() in bio.lower():
                risk_score += 0.15
                flags.append(f"Suspicious content: mentions '{pattern}'")

        # Normalize score
        risk_score = min(risk_score, 1.0)

        # Determine risk level
        if risk_score < 0.3:
            risk_level = "low"
            recommendation = "User appears legitimate. Standard monitoring recommended."
        elif risk_score < 0.6:
            risk_level = "medium"
            recommendation = "Enhanced verification recommended before high-value transactions."
        else:
            risk_level = "high"
            recommendation = "Manual review required. Consider restricting account features."

        return FraudRisk(
            risk_score=round(risk_score * 100, 2),
            risk_level=risk_level,
            flags=flags,
            recommendation=recommendation
        )

    def analyze_job_posting(self, job_data: Dict[str, Any]) -> FraudRisk:
        """Analyze fraud risk for a job posting"""

        risk_score = 0.0
        flags = []

        title = job_data.get("title", "").lower()
        description = job_data.get("description", "").lower()
        combined_text = f"{title} {description}"

        # Check for spam patterns
        for pattern in self.spam_patterns:
            if pattern in combined_text:
                risk_score += 0.1
                flags.append(f"Spam indicator: '{pattern}'")

        # Check for high-risk payment terms
        for pattern in self.high_risk_patterns:
            if pattern in combined_text:
                risk_score += 0.2
                flags.append(f"High-risk payment term: '{pattern}'")

        # Check budget anomalies
        budget_max = job_data.get("budget_max", 0)
        if budget_max > 50000:
            risk_score += 0.1
            flags.append("Unusually high budget")

        if budget_max == 0 or budget_max is None:
            risk_score += 0.05
            flags.append("No budget specified")

        # Check description quality
        word_count = len(description.split())
        if word_count < 20:
            risk_score += 0.1
            flags.append("Very short description")

        # Normalize
        risk_score = min(risk_score, 1.0)

        if risk_score < 0.3:
            risk_level = "low"
            recommendation = "Job posting appears legitimate."
        elif risk_score < 0.6:
            risk_level = "medium"
            recommendation = "Review job details before applying."
        else:
            risk_level = "high"
            recommendation = "Job posting flagged for manual review."

        return FraudRisk(
            risk_score=round(risk_score * 100, 2),
            risk_level=risk_level,
            flags=flags,
            recommendation=recommendation
        )

    def analyze_proposal(self, proposal_data: Dict[str, Any]) -> FraudRisk:
        """Analyze fraud risk for a proposal"""

        risk_score = 0.0
        flags = []

        cover_letter = proposal_data.get("cover_letter", "").lower()
        bid_amount = proposal_data.get("bid_amount", 0)
        job_budget = proposal_data.get("job_budget", 0)

        # Check for suspicious content
        for pattern in self.high_risk_patterns:
            if pattern in cover_letter:
                risk_score += 0.2
                flags.append(f"Suspicious content: '{pattern}'")

        # Check bid amount
        if job_budget > 0:
            bid_ratio = bid_amount / job_budget
            if bid_ratio < 0.1:
                risk_score += 0.2
                flags.append("Bid significantly below budget")
            elif bid_ratio > 3:
                risk_score += 0.15
                flags.append("Bid significantly above budget")

        # Check for generic proposals
        generic_phrases = ["i am interested", "hire me", "i can do this", "contact me"]
        generic_count = sum(1 for phrase in generic_phrases if phrase in cover_letter)
        if generic_count >= 2:
            risk_score += 0.1
            flags.append("Generic proposal content")

        # Normalize
        risk_score = min(risk_score, 1.0)

        if risk_score < 0.3:
            risk_level = "low"
            recommendation = "Proposal appears legitimate."
        elif risk_score < 0.6:
            risk_level = "medium"
            recommendation = "Review freelancer profile carefully."
        else:
            risk_level = "high"
            recommendation = "Proposal flagged for review."

        return FraudRisk(
            risk_score=round(risk_score * 100, 2),
            risk_level=risk_level,
            flags=flags,
            recommendation=recommendation
        )

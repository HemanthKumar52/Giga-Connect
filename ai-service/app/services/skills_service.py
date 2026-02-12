from typing import List, Dict, Any
import re
from .embedding_service import get_embedding_service
from ..models.schemas import SkillAnalysis


class SkillsService:
    def __init__(self):
        self.embedding_service = get_embedding_service()

        # Common skills database
        self.known_skills = {
            "programming": [
                "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
                "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab"
            ],
            "frontend": [
                "react", "angular", "vue", "vue.js", "next.js", "nuxt", "svelte",
                "html", "css", "sass", "tailwind", "bootstrap", "jquery"
            ],
            "backend": [
                "node.js", "express", "django", "flask", "fastapi", "spring boot",
                "laravel", "rails", "asp.net", "nestjs"
            ],
            "database": [
                "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
                "dynamodb", "sqlite", "oracle", "sql server", "cassandra"
            ],
            "cloud": [
                "aws", "azure", "gcp", "google cloud", "heroku", "digitalocean",
                "docker", "kubernetes", "terraform", "ansible"
            ],
            "ai_ml": [
                "machine learning", "deep learning", "tensorflow", "pytorch",
                "scikit-learn", "nlp", "computer vision", "data science"
            ],
            "mobile": [
                "react native", "flutter", "ios", "android", "swift", "kotlin"
            ],
            "design": [
                "figma", "sketch", "adobe xd", "photoshop", "illustrator",
                "ui design", "ux design", "graphic design"
            ],
            "devops": [
                "ci/cd", "jenkins", "github actions", "gitlab ci", "devops",
                "linux", "bash", "monitoring", "prometheus", "grafana"
            ],
            "blockchain": [
                "solidity", "ethereum", "web3", "smart contracts", "defi", "nft"
            ]
        }

        # Flatten skills for quick lookup
        self.all_skills = set()
        for category_skills in self.known_skills.values():
            self.all_skills.update(s.lower() for s in category_skills)

    def extract_skills(self, text: str) -> SkillAnalysis:
        """Extract skills from text (resume, job description, etc.)"""

        text_lower = text.lower()
        extracted = []
        categories = {}
        confidence_scores = {}

        # Direct matching
        for category, skills in self.known_skills.items():
            for skill in skills:
                if skill.lower() in text_lower:
                    extracted.append(skill)
                    if category not in categories:
                        categories[category] = []
                    categories[category].append(skill)
                    confidence_scores[skill] = 1.0

        # Pattern matching for years of experience
        exp_pattern = r"(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience\s+(?:with|in)\s+)?([a-zA-Z\+\#\.]+)"
        matches = re.findall(exp_pattern, text_lower)

        for years, skill in matches:
            if skill not in [s.lower() for s in extracted]:
                extracted.append(skill)
                confidence_scores[skill] = 0.7

        # Remove duplicates while preserving order
        seen = set()
        unique_extracted = []
        for skill in extracted:
            if skill.lower() not in seen:
                seen.add(skill.lower())
                unique_extracted.append(skill)

        return SkillAnalysis(
            extracted_skills=unique_extracted,
            skill_categories=categories,
            confidence_scores=confidence_scores
        )

    def get_related_skills(self, skills: List[str], limit: int = 10) -> List[Dict[str, Any]]:
        """Get related skills based on semantic similarity"""

        if not skills:
            return []

        # Encode input skills
        skills_text = ", ".join(skills)
        skills_embedding = self.embedding_service.encode_single(skills_text)

        # Find related skills
        all_skill_list = list(self.all_skills)
        all_embeddings = self.embedding_service.encode(all_skill_list)

        similarities = self.embedding_service.batch_similarity(skills_embedding, all_embeddings)

        # Sort by similarity
        skill_scores = list(zip(all_skill_list, similarities))
        skill_scores.sort(key=lambda x: x[1], reverse=True)

        # Filter out input skills and return top related
        input_skills_lower = set(s.lower() for s in skills)
        related = []

        for skill, score in skill_scores:
            if skill not in input_skills_lower and score > 0.3:
                related.append({
                    "skill": skill,
                    "relevance_score": round(float(score) * 100, 2)
                })
                if len(related) >= limit:
                    break

        return related

    def validate_skills(self, skills: List[str]) -> Dict[str, Any]:
        """Validate and standardize skill names"""

        validated = []
        suggestions = {}

        for skill in skills:
            skill_lower = skill.lower().strip()

            if skill_lower in self.all_skills:
                # Direct match
                validated.append(skill)
            else:
                # Try to find similar skill
                skill_embedding = self.embedding_service.encode_single(skill_lower)
                all_embeddings = self.embedding_service.encode(list(self.all_skills))
                similarities = self.embedding_service.batch_similarity(skill_embedding, all_embeddings)

                max_idx = similarities.argmax()
                max_sim = similarities[max_idx]

                if max_sim > 0.8:
                    matched_skill = list(self.all_skills)[max_idx]
                    validated.append(matched_skill)
                    suggestions[skill] = matched_skill
                else:
                    validated.append(skill)  # Keep original

        return {
            "validated_skills": validated,
            "suggestions": suggestions,
            "is_valid": len(suggestions) == 0
        }

"""
Generate placement-prep recommendations from resume analysis using Gemini.
"""

import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
]


def _get_client():
    from google import genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set. Add it to your .env file.")
    return genai.Client(api_key=api_key)


def _parse_json_response(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _call_gemini(client, prompt: str) -> str:
    last_error = None

    for model in GEMINI_MODELS:
        for attempt in range(2):
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                return response.text
            except Exception as exc:
                last_error = exc
                message = str(exc)
                if "429" in message or "RESOURCE_EXHAUSTED" in message:
                    time.sleep(2 * (attempt + 1))
                    continue
                break

    raise last_error or RuntimeError("All Gemini models failed.")


def generate_recommendations(analysis: dict, resume_text: str = "") -> dict:
    client = _get_client()

    prompt = f"""You are a career coach helping students prepare for internships and placements.

Based on this resume analysis, provide actionable recommendations.

Resume analysis:
{json.dumps(analysis, indent=2)}

Resume excerpt (first 1500 chars):
{resume_text[:1500]}

Return ONLY valid JSON with this exact structure:
{{
  "summary": "2-3 sentence overview of candidate readiness",
  "predicted_role_fit": "how well the profile matches the predicted role",
  "missing_skills": ["skill1", "skill2"],
  "recommended_topics": ["topic1", "topic2", "topic3"],
  "resume_improvements": ["improvement1", "improvement2"],
  "learning_path": ["step1", "step2", "step3"],
  "practice_focus": ["aptitude area or technical area to prioritize"]
}}
"""

    response_text = _call_gemini(client, prompt)
    return _parse_json_response(response_text)


def generate_recommendations_safe(analysis: dict, resume_text: str = "") -> dict:
    try:
        return generate_recommendations(analysis, resume_text)
    except Exception as exc:
        return {
            "summary": "AI recommendations unavailable right now.",
            "predicted_role_fit": "",
            "missing_skills": [],
            "recommended_topics": [],
            "resume_improvements": analysis.get("suggestions", []),
            "learning_path": [],
            "practice_focus": [],
            "error": str(exc),
        }

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

def _load_env():
    """Load environment variables from .env in likely repository locations."""
    candidates = [
        PROJECT_ROOT / ".env",
        PROJECT_ROOT / "ml" / ".env",
        Path.cwd() / ".env",
    ]
    for env_path in candidates:
        if env_path.exists():
            load_dotenv(env_path)
            return env_path
    load_dotenv()
    return None

# Load env on import and allow reloading when the helper is called
_load_env()

# Try gemini models in order of preference
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-pro",
    "gemini-pro-latest",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-preview",
]
# Also try the full resource name format if short name is not accepted
GEMINI_MODELS = GEMINI_MODELS + [f"models/{model}" for model in GEMINI_MODELS]


def _get_client():
    """Get Gemini API client with proper error handling"""
    try:
        from google import genai
    except ImportError:
        raise RuntimeError("google-genai not installed. Run: pip install google-genai")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in .env file or environment")

    if api_key.startswith("your_"):
        raise ValueError("GEMINI_API_KEY contains placeholder value. Get a real key from https://aistudio.google.com/apikey")
    
    try:
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Gemini client: {e}")


def _parse_json_response(text: str) -> dict:
    """Parse JSON from response, handling markdown code blocks"""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _call_gemini(client, prompt: str) -> str:
    """Call Gemini API with retry logic and model fallback"""
    last_error = None

    for model in GEMINI_MODELS:
        for attempt in range(3):  # 3 attempts per model
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt
                )
                return response.text
            except Exception as exc:
                last_error = exc
                message = str(exc)
                
                # Rate limit - retry with backoff
                if "429" in message or "RESOURCE_EXHAUSTED" in message:
                    wait_time = min(2 ** attempt, 32)  # Exponential backoff, max 32s
                    print(f"Rate limited on {model}, waiting {wait_time}s before retry...", 
                          file=__import__('sys').stderr)
                    time.sleep(wait_time)
                    continue
                
                # API key invalid - don't retry
                if "400" in message and "INVALID_ARGUMENT" in message and "API key" in message:
                    raise RuntimeError(f"Invalid API key: {message}")
                
                # Other errors - try next model
                print(f"Model {model} failed: {type(exc).__name__}", 
                      file=__import__('sys').stderr)
                break

    raise last_error or RuntimeError("All Gemini models exhausted")


def generate_recommendations(analysis: dict, resume_text: str = "") -> dict:
    """Generate resume recommendations using Gemini API"""
    client = _get_client()

    # Build a concise prompt
    skills_str = ", ".join(analysis.get("entities", {}).get("skills", [])[:5])
    education_str = analysis.get("entities", {}).get("education", "Not specified")
    experience_str = "Yes" if analysis.get("entities", {}).get("experience") else "No"
    
    prompt = f"""You are a career coach. Analyze this candidate profile and provide recommendations.

Profile:
- Resume Score: {analysis.get('resume_score', 0)}/100
- Predicted Role: {analysis.get('predicted_role', 'Unknown')}
- Top Skills: {skills_str or 'Not found'}
- Education: {education_str}
- Experience: {experience_str}
- Confidence: {analysis.get('confidence', 0):.0%}

Resume excerpt (first 500 chars):
{resume_text[:500]}

Return a JSON object with this exact structure:
{{
  "summary": "Brief 1-2 sentence overview of candidate profile",
  "role_fit": "How well profile matches predicted role (poor/fair/good/excellent)",
  "missing_skills": ["skill1", "skill2"],
  "focus_areas": ["topic1", "topic2"],
  "next_steps": ["action1", "action2"],
  "estimated_readiness": "0-100 percentage string like 75%"
}}

Return ONLY the JSON, no other text."""

    response_text = _call_gemini(client, prompt)
    return _parse_json_response(response_text)


def generate_recommendations_safe(analysis: dict, resume_text: str = "") -> dict:
    """Generate recommendations with comprehensive error handling"""
    try:
        import sys
        print(f"[Gemini] Starting recommendation generation...", file=sys.stderr)
        
        result = generate_recommendations(analysis, resume_text)
        
        print(f"[Gemini] Recommendations generated successfully", file=sys.stderr)
        return result
        
    except RuntimeError as e:
        # Critical errors like invalid API key
        message = f"Gemini error: {e}"
        print(f"[Gemini] ERROR: {message}", file=__import__('sys').stderr)
        return {"error": message}
        
    except json.JSONDecodeError as e:
        message = f"Gemini JSON parse error: {e}"
        print(f"[Gemini] JSON parsing error: {message}", file=__import__('sys').stderr)
        return {"error": message}
        
    except Exception as e:
        # Catch all other errors (quota exceeded, rate limit, network, etc)
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            message = "Gemini quota exhausted. Please check your plan and billing details."
            print(f"[Gemini] {message}", file=__import__('sys').stderr)
        else:
            message = f"Gemini error: {type(e).__name__}: {e}"
            print(f"[Gemini] {message}", file=__import__('sys').stderr)
        
        return {"error": message}

"""
Extract resume entities using spaCy NER and pattern matching.

Usage:
    python ml/scripts/extract_entities.py "resume text here"
"""

import re
import sys
from functools import lru_cache
from pathlib import Path

import pandas as pd
import spacy

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RESUME_DATA_PATH = PROJECT_ROOT / "Datasets" / "Synthetic Nepali Resume Dataset" / "Resume_Dataset.csv"

EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"(\+?\d[\d\s\-().]{7,}\d)")
EDUCATION_KEYWORDS = (
    "b.tech",
    "b.e.",
    "bsc",
    "b.sc",
    "m.tech",
    "mtech",
    "msc",
    "mba",
    "bca",
    "diploma",
    "phd",
    "computer science",
    "information technology",
)
CERTIFICATION_KEYWORDS = ("certified", "certification", "certificate", "cka", "pmp", "aws certified")


@lru_cache(maxsize=1)
def load_skill_lexicon() -> set[str]:
    df = pd.read_csv(RESUME_DATA_PATH, usecols=["skills", "stack"])
    tokens: set[str] = set()
    for column in ("skills", "stack"):
        for value in df[column].dropna():
            for item in str(value).split(";"):
                skill = item.strip()
                if skill:
                    tokens.add(skill.lower())
    return tokens


@lru_cache(maxsize=1)
def get_nlp():
    return spacy.load("en_core_web_sm")


def extract_skills(text: str) -> list[str]:
    """Extract skills using word-boundary matching to avoid false positives."""
    lowered = text.lower()
    lexicon = load_skill_lexicon()
    
    # Short skills (<=2 chars) that are too ambiguous to substring-match
    AMBIGUOUS_SHORT = {'go', 'r', 'c', 'ai', 'bi', 'it', 'os', 'ui', 'ux', 'qa'}
    
    found = []
    for skill in lexicon:
        if len(skill) <= 2 and skill in AMBIGUOUS_SHORT:
            # For short ambiguous skills, require word boundary (space/punctuation around it)
            import re
            if re.search(r'(?<![a-z])' + re.escape(skill) + r'(?![a-z])', lowered):
                # Extra check: "go" only counts if it's clearly a programming language context
                if skill == 'go' and not re.search(r'\b(golang|go\s*(lang|programming|framework))\b', lowered):
                    continue
                found.append(skill)
        elif len(skill) <= 3:
            # For 3-char skills (css, sql, git, etc), use word boundary
            import re
            if re.search(r'(?<![a-z])' + re.escape(skill) + r'(?![a-z])', lowered):
                found.append(skill)
        else:
            # Longer skills (4+ chars) are safe for substring match
            if skill in lowered:
                found.append(skill)
    
    return sorted(set(found), key=str.lower)


def extract_education_lines(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = []
    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in EDUCATION_KEYWORDS):
            matches.append(line)
    return matches


def extract_certifications(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = []
    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in CERTIFICATION_KEYWORDS):
            matches.append(line)
    return matches


def extract_experience_mentions(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    pattern = re.compile(r"\b(\d+)\+?\s*years?\s+(of\s+)?experience\b", re.IGNORECASE)
    role_pattern = re.compile(r"(developer|engineer|intern|analyst|designer|manager|lead|consultant)\b", re.IGNORECASE)
    matches = []
    for line in lines:
        # Skip lines that are just section headers
        if line.lower().strip() in ('experience', 'work experience', 'professional experience', 'experiences'):
            continue
        # Match lines with years of experience OR job-role-like lines under experience section
        if pattern.search(line) or (role_pattern.search(line) and len(line) > 15):
            matches.append(line)
    return matches[:5]


def extract_entities(text: str) -> dict:
    doc = get_nlp()(text)

    persons = sorted({ent.text for ent in doc.ents if ent.label_ == "PERSON"})
    organizations = sorted({ent.text for ent in doc.ents if ent.label_ == "ORG"})
    locations = sorted({ent.text for ent in doc.ents if ent.label_ == "GPE"})
    dates = sorted({ent.text for ent in doc.ents if ent.label_ == "DATE"})

    # Filter out false-positive organizations (short tech terms that spaCy misclassifies)
    FALSE_ORGS = {'API', 'CSS', 'HTML', 'SQL', 'REST', 'HTTP', 'JSON', 'XML', 
                  'SDK', 'CLI', 'OOP', 'MVC', 'UI', 'UX', 'CI', 'CD', 'AWS',
                  'GCP', 'Cer', 'Hac', 'Git', 'DevOps'}
    organizations = [o for o in organizations if o not in FALSE_ORGS and len(o) > 3]

    emails = sorted(set(EMAIL_PATTERN.findall(text)))
    phones = sorted(set(PHONE_PATTERN.findall(text)))
    
    # Clean null bytes from all strings
    def clean_strings(items):
        return [str(item).replace('\x00', '').strip() for item in items if item]

    return {
        "person": clean_strings(persons[:3]),
        "email": clean_strings(emails),
        "phone": clean_strings(phones),
        "organizations": clean_strings(organizations[:10]),
        "locations": clean_strings(locations[:5]),
        "dates": clean_strings(dates[:10]),
        "skills": clean_strings(extract_skills(text)),
        "education": clean_strings(extract_education_lines(text)),
        "certifications": clean_strings(extract_certifications(text)),
        "experience": clean_strings(extract_experience_mentions(text)),
    }


def main() -> None:
    if len(sys.argv) < 2:
        print('Usage: python ml/scripts/extract_entities.py "resume text"')
        sys.exit(1)

    text = " ".join(sys.argv[1:])
    print(extract_entities(text))


if __name__ == "__main__":
    main()

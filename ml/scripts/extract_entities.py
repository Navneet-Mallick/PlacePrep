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
    
    # Deduplicate: if "rest apis" exists, remove "rest"; if "express.js" exists remove "express"
    found_set = set(found)
    to_remove = set()
    for s in found_set:
        for other in found_set:
            if s != other and s in other and len(s) < len(other):
                to_remove.add(s)
    
    # Remove false positives: "scala" often matches "scalable"
    FALSE_SKILLS = set()
    if 'scala' in found_set:
        import re
        if not re.search(r'(?<![a-z])scala(?![a-z])', lowered):
            FALSE_SKILLS.add('scala')
        elif re.search(r'scalab', lowered) and not re.search(r'(?<![a-z])scala(?!\w)', lowered):
            FALSE_SKILLS.add('scala')
    
    final = sorted(set(found) - to_remove - FALSE_SKILLS, key=str.lower)
    return final


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
    # Pre-clean: fix broken words from PDF extraction (spaces inserted mid-word)
    # Common pattern: "Dev elop er" → "Developer", "Exp erienced" → "Experienced"
    import re
    # Remove single spaces between lowercase letters that break words
    # e.g. "Dev elop er" → "Developer" but keep "New York" as is
    cleaned = re.sub(r'(?<=[a-z]) (?=[a-z])', '', text)
    # Also fix cases like "W eb" → "Web", "T ec" → "Tec"
    cleaned = re.sub(r'(?<=[A-Z]) (?=[a-z]{1,3}(?:\s|[^a-z]))', '', cleaned)
    
    doc = get_nlp()(cleaned)

    persons = sorted({ent.text for ent in doc.ents if ent.label_ == "PERSON"})
    organizations = sorted({ent.text for ent in doc.ents if ent.label_ == "ORG"})
    locations = sorted({ent.text for ent in doc.ents if ent.label_ == "GPE"})
    dates = sorted({ent.text for ent in doc.ents if ent.label_ == "DATE"})

    # Filter persons: must be at least 2 words (first + last name), no tech terms
    TECH_WORDS = {'api', 'css', 'html', 'sql', 'rest', 'http', 'json', 'mern',
                  'react', 'node', 'express', 'mongodb', 'python', 'java', 'c++',
                  'git', 'linux', 'docker', 'aws', 'redis', 'mysql', 'go', 'rust',
                  'flask', 'django', 'vue', 'angular', 'typescript', 'javascript',
                  'campus', 'college', 'university', 'bac', 'mac', 'nativ'}
    persons = [p for p in persons if len(p.split()) >= 2 and
               not any(t in p.lower() for t in TECH_WORDS)]
    
    # Filter locations: must look like actual place names
    locations = [l for l in locations if len(l) > 3 and
                 not any(t in l.lower() for t in TECH_WORDS) and
                 '.' not in l and not l.startswith('(')]

    # Filter out false-positive organizations
    # spaCy's small model often misclassifies tech terms and partial phrases as ORG
    TECH_TERMS = {'API', 'CSS', 'HTML', 'SQL', 'REST', 'HTTP', 'JSON', 'XML',
                  'SDK', 'CLI', 'OOP', 'MVC', 'UI', 'UX', 'CI', 'CD', 'AWS',
                  'GCP', 'Git', 'DevOps', 'Node', 'React', 'Vue', 'Angular',
                  'Docker', 'Linux', 'MongoDB', 'Redis', 'PostgreSQL', 'MySQL'}
    
    skills_set = set(extract_skills(text))  # Already-identified skills
    
    filtered_orgs = []
    for org in organizations:
        org_clean = org.strip()
        # Skip if too short
        if len(org_clean) <= 3:
            continue
        # Skip if it's a known tech term
        if org_clean in TECH_TERMS:
            continue
        # Skip if it looks like a tech skill (contains .js, .py, etc)
        if any(ext in org_clean.lower() for ext in ['.js', '.py', '.ts', '.net', '.io']):
            continue
        # Skip if it matches a detected skill
        if org_clean.lower() in skills_set:
            continue
        # Skip partial words / fragments (less than 2 words and contains uppercase mid-word)
        if 'xX' in org_clean or 'Hac' == org_clean:
            continue
        # Skip if it's clearly an education term being mislabeled
        if any(edu in org_clean.lower() for edu in ['engineering', 'computer', 'science', 'technology', 'university']):
            continue
        filtered_orgs.append(org_clean)
    
    organizations = filtered_orgs[:5]

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

"""
Extract resume entities using spaCy NER and pattern matching.

Designed to handle:
- Broken PDF text (spaces in middle of words)
- Concatenated text (no spaces)
- False positive filtering for tech terms
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
    "b.tech", "b.e.", "bsc", "b.sc", "m.tech", "mtech", "msc", "mba",
    "bca", "diploma", "phd", "computer science", "information technology",
    "bachelor", "master", "engineering", "degree",
)

CERTIFICATION_KEYWORDS = (
    "certified", "certification", "certificate", "aws certified",
    "google certified", "microsoft certified", "coursera", "udemy",
)

# Skills that are too short to safely substring-match
AMBIGUOUS_SKILLS = {'go', 'r', 'c', 'ai', 'bi', 'it', 'os', 'ui', 'ux', 'qa', 'ml'}


@lru_cache(maxsize=1)
def load_skill_lexicon() -> set:
    """Load skill names from the resume dataset."""
    df = pd.read_csv(RESUME_DATA_PATH, usecols=["skills", "stack"])
    tokens = set()
    for column in ("skills", "stack"):
        for value in df[column].dropna():
            for item in str(value).split(";"):
                skill = item.strip().lower()
                if skill and len(skill) > 1:
                    tokens.add(skill)
    return tokens


@lru_cache(maxsize=1)
def get_nlp():
    # Try medium model first (better NER accuracy), fall back to small
    try:
        return spacy.load("en_core_web_md")
    except OSError:
        return spacy.load("en_core_web_sm")


def clean_pdf_text(text: str) -> str:
    """Fix common PDF extraction artifacts."""
    # Fix spaces inserted mid-word: "Dev elop er" → "Developer"
    # Only join when a lowercase follows a lowercase with single space
    text = re.sub(r'(?<=[a-z]) (?=[a-z]{1,2}\b)', '', text)
    # Fix "W eb" → "Web" (capital + space + short lowercase)
    text = re.sub(r'(?<=[A-Z]) (?=[a-z]{1,3}\b)', '', text)
    return text


def extract_skills(text: str) -> list:
    """Extract technical skills with word-boundary matching."""
    lowered = text.lower()
    lexicon = load_skill_lexicon()
    found = set()

    for skill in lexicon:
        if skill in AMBIGUOUS_SKILLS:
            # Require exact word boundary for short/ambiguous skills
            pattern = r'(?<![a-zA-Z])' + re.escape(skill) + r'(?![a-zA-Z])'
            if re.search(pattern, lowered):
                # Extra: "go" only if golang context
                if skill == 'go' and not re.search(r'(golang|go\s*lang)', lowered):
                    continue
                found.add(skill)
        elif len(skill) <= 3:
            # Short skills (css, sql, git) — word boundary
            pattern = r'(?<![a-zA-Z])' + re.escape(skill) + r'(?![a-zA-Z])'
            if re.search(pattern, lowered):
                found.add(skill)
        else:
            # 4+ char skills — substring match is safe
            if skill in lowered:
                # But check "scala" vs "scalable"
                if skill == 'scala' and 'scalab' in lowered:
                    if not re.search(r'(?<![a-zA-Z])scala(?![a-zA-Z])', lowered):
                        continue
                found.add(skill)

    # Deduplicate: remove "rest" if "rest apis" exists
    to_remove = set()
    for s in found:
        for other in found:
            if s != other and s in other and len(s) < len(other):
                to_remove.add(s)

    return sorted(found - to_remove)


def extract_education(text: str) -> list:
    """Extract education entries."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = []
    for line in lines:
        lowered = line.lower()
        # Skip section headers
        if lowered in ('education', 'academic background', 'qualification'):
            continue
        if any(kw in lowered for kw in EDUCATION_KEYWORDS):
            # Skip very short lines (just the keyword alone)
            if len(line) > 10:
                matches.append(line[:150])  # Truncate long lines
    return matches[:4]


def extract_certifications(text: str) -> list:
    """Extract certifications — skip headers and project descriptions."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = []
    for line in lines:
        lowered = line.lower()
        # Must contain a certification keyword
        if not any(kw in lowered for kw in CERTIFICATION_KEYWORDS):
            continue
        # Skip section headers
        if lowered.rstrip(':') in ('certifications', 'training/certifications',
                                    'certificates', 'training', 'courses'):
            continue
        # Skip project descriptions (contain action verbs)
        if any(v in lowered for v in ['developed', 'built', 'created', 'implemented',
                                       'designed', 'deployed', 'integrated']):
            continue
        # Skip overly long lines (likely descriptions, not cert names)
        if len(line) > 120:
            continue
        matches.append(line[:100])
    return matches[:4]


def extract_experience(text: str) -> list:
    """Extract work experience entries."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    role_pattern = re.compile(
        r'(developer|engineer|intern|analyst|designer|manager|lead|consultant|'
        r'trainee|associate|specialist|coordinator|supervisor|freelanc)',
        re.IGNORECASE
    )
    year_pattern = re.compile(r'(20\d{2}|19\d{2})')
    matches = []

    for line in lines:
        lowered = line.lower()
        # Skip section headers
        if lowered.rstrip(':') in ('experience', 'work experience',
                                    'professional experience', 'internship'):
            continue
        # Match lines with job-role keywords OR year ranges
        has_role = role_pattern.search(line)
        has_year = year_pattern.search(line)
        if has_role and len(line) > 10:
            matches.append(line[:150])
        elif has_year and 'present' in lowered:
            matches.append(line[:150])
    return matches[:5]


def filter_organizations(orgs: list, skills: set) -> list:
    """Remove false-positive organizations — very strict."""
    filtered = []
    for org in orgs:
        org = org.strip()
        # Length checks
        if len(org) <= 4 or len(org) > 40:
            continue
        # No spaces in 12+ char = concatenated garbage
        if len(org) > 12 and ' ' not in org:
            continue
        # Contains broken space pattern (single char then space then word)
        if re.search(r'\b[A-Z]\s[a-z]', org):
            continue
        # Starts with digit
        if org[0].isdigit():
            continue
        # Contains slash
        if '/' in org:
            continue
        # Is a skill
        if org.lower() in skills:
            continue
        # Tech extensions
        if any(ext in org for ext in ['.js', '.py', '.ts', '.net', '.io', 'API', 'ML']):
            continue
        # Bad keywords
        bad = ['engineering', 'computer', 'science', 'technology', 'position',
               'rank', 'built', 'developed', 'model', 'predict', 'using',
               'based', 'system', 'platform', 'hackathon', 'project',
               'learning', 'certificate', 'stack', 'fastapi', 'mern',
               'fast', 'men', 'anc']
        if any(w in org.lower() for w in bad):
            continue
        filtered.append(org)
    return filtered[:3]


def filter_persons(persons: list) -> list:
    """Keep only likely real names (2+ words, no tech terms)."""
    tech = {'api', 'css', 'html', 'sql', 'rest', 'mern', 'react', 'node',
            'express', 'python', 'java', 'c++', 'git', 'linux', 'docker',
            'campus', 'college', 'bac', 'mac', 'nativ', 'intern', 'stack'}
    filtered = []
    for p in persons:
        words = p.split()
        if len(words) < 2:
            continue
        if any(t in p.lower() for t in tech):
            continue
        if len(p) > 40:
            continue
        filtered.append(p)
    return filtered[:2]


def filter_locations(locations: list) -> list:
    """Keep only likely real locations — very strict."""
    bad = {'express', 'react', 'node', 'mern', 'nativ', 'flask',
           'django', 'angular', 'vue', 'redis', 'mongo', 'hac',
           'linux', 'scikit', 'memb', 'stack', 'fast', 'python',
           'java', 'docker', 'aws', 'git', 'api', 'rest', 'css',
           'html', 'sql', 'mysql', 'http', 'json', 'xml'}
    # Known real locations to whitelist
    real_places = {'nepal', 'india', 'kathmandu', 'dharan', 'biratnagar',
                   'pokhara', 'lalitpur', 'bhaktapur', 'chitwan', 'morang'}
    filtered = []
    for loc in locations:
        loc_lower = loc.lower().strip()
        if len(loc) <= 3:
            continue
        if loc_lower in bad or any(b in loc_lower for b in bad):
            continue
        if '.' in loc or '/' in loc:
            continue
        # Only keep if it looks like a real place (capitalized, reasonable length)
        if loc[0].isupper() and len(loc) < 30:
            filtered.append(loc)
    return filtered[:4]


def extract_entities(text: str) -> dict:
    """Main extraction function. Uses pattern matching primarily, NER as supplement."""
    # Clean PDF artifacts
    cleaned = clean_pdf_text(text)

    # Pattern-based extraction (RELIABLE for resumes)
    emails = sorted(set(EMAIL_PATTERN.findall(text)))
    phones = sorted(set(PHONE_PATTERN.findall(text)))
    skills = extract_skills(text)
    education = extract_education(text)
    certifications = extract_certifications(text)
    experience = extract_experience(text)

    # For person name: use the FIRST line of the resume (standard resume format)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    person = []
    if lines:
        first_line = lines[0].strip()
        # First line is usually the name if it's short (< 40 chars) and doesn't contain @ or http
        if len(first_line) < 40 and '@' not in first_line and 'http' not in first_line:
            # Clean broken spaces in name
            name = re.sub(r'\s+', ' ', first_line).strip()
            if len(name.split()) <= 4 and len(name) > 3:
                person = [name]

    # For organizations: only extract from NER if they pass STRICT filtering
    # Run spaCy only for orgs that look like real company names
    doc = get_nlp()(cleaned)
    raw_orgs = sorted({ent.text for ent in doc.ents if ent.label_ == "ORG"})
    skills_set = set(skills)
    organizations = filter_organizations(raw_orgs, skills_set)

    # For locations: extract from NER but filter aggressively
    raw_locations = sorted({ent.text for ent in doc.ents if ent.label_ == "GPE"})
    locations = filter_locations(raw_locations)

    # Clean null bytes
    def clean(items):
        return [str(item).replace('\x00', '').strip() for item in items if item and str(item).strip()]

    return {
        "person": clean(person),
        "email": clean(emails),
        "phone": clean(phones[:3]),
        "organizations": clean(organizations),
        "locations": clean(locations),
        "dates": [],  # Dates are unreliable from broken PDFs, skip
        "skills": clean(skills),
        "education": clean(education),
        "certifications": clean(certifications),
        "experience": clean(experience),
    }


def main() -> None:
    if len(sys.argv) < 2:
        print('Usage: python extract_entities.py "resume text"')
        sys.exit(1)
    text = " ".join(sys.argv[1:])
    import json
    print(json.dumps(extract_entities(text), indent=2))


if __name__ == "__main__":
    main()

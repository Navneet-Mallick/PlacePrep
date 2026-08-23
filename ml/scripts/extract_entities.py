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
YEAR_RANGE_PATTERN = re.compile(r"^\d{4}\s*[-–]\s*\d{4}$")

EDUCATION_KEYWORDS = (
    "b.tech", "b.e.", "bsc", "b.sc", "m.tech", "mtech", "msc", "mba",
    "bca", "diploma", "phd", "computer science", "information technology",
    "bachelor", "master", "engineering", "degree", "university", "college",
    "campus", "+2", "higher secondary", "csit", "beit", "mca",
    "bach elor",  # broken PDF version
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
    """Light cleaning of PDF artifacts — only fix the most common patterns."""
    # Fix "Engine ering" → "Engineering"
    text = re.sub(r'(\w{3,}) (ering|tion|ment)\b', r'\1\2', text)
    # Fix "Jav aScript" → "JavaScript"  
    text = re.sub(r'\b([A-Z][a-z]{1,3}) ([a-z]+[A-Z][a-z]+)\b', r'\1\2', text)
    # Fix "Pr esent" → "Present"
    text = re.sub(r'\b([A-Z][a-z]) ([a-z]{3,6})\b', r'\1\2', text)
    # Clean double spaces
    text = re.sub(r'  +', ' ', text)
    return text


def clean_display_text(text: str) -> str:
    """Aggressively clean text for final display to user."""
    # Fix suffix breaks: "Engine ering" → "Engineering"
    text = re.sub(r'(\w{2,}) (ering|tion|ment|ness|ible|able|ance|ence|ling|ning|ring|ting|sing)\b', r'\1\2', text)
    # Fix "Pr esent" / "Pr ofessional"
    text = re.sub(r'\b([A-Z][a-z]{1,2}) ([a-z]{3,})\b',
                  lambda m: m.group(1) + m.group(2) if not m.group(2)[0].isupper() else m.group(0), text)
    # Fix "Dev elop er" style triple fragments
    text = re.sub(r'\b(\w{2,4}) (\w{2,5}) (er|or|ed|ing|ly)\b', r'\1\2\3', text)
    # Fix remaining "Develop er" / "Design er" (word + space + short suffix)
    text = re.sub(r'(\w{4,}) (er|or|ed|al|ly|ing)\b', r'\1\2', text)
    # Fix "Jav aScript"
    text = re.sub(r'\b([A-Z][a-z]{1,3}) ([a-z]+[A-Z][a-z]+)\b', r'\1\2', text)
    # Clean bullet point artifacts
    text = re.sub(r'^[\u2022\u2023\u25e6\u2043\u2219•·]\s*', '', text)
    # Clean double spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def extract_skills(text: str) -> list:
    """Extract technical skills with word-boundary matching."""
    lowered = text.lower()
    lexicon = load_skill_lexicon()
    
    # Supplement with common skills that may not be in the dataset
    EXTRA_SKILLS = {
        'sql', 'pandas', 'numpy', 'matplotlib', 'tensorflow', 'pytorch',
        'keras', 'scikit-learn', 'opencv', 'flask', 'fastapi', 'spring boot',
        'angular', 'vue.js', 'svelte', 'next.js', 'nuxt.js', 'tailwind',
        'bootstrap', 'sass', 'less', 'graphql', 'rest api', 'rest apis',
        'microservices', 'ci/cd', 'jenkins', 'github actions', 'terraform',
        'ansible', 'linux', 'nginx', 'apache', 'rabbitmq', 'kafka',
        'elasticsearch', 'data analysis', 'machine learning', 'deep learning',
        'nlp', 'computer vision', 'data science', 'power bi', 'tableau',
        'excel', 'jupyter', 'postman', 'figma', 'photoshop', 'illustrator',
        'blender', 'unity', 'unreal', 'c#', 'rust', 'scala', 'perl',
        'bash', 'powershell', 'matlab', 'r', 'hadoop', 'spark', 'airflow',
        'dbt', 'snowflake', 'bigquery', 'supabase', 'firebase',
    }
    lexicon = lexicon | EXTRA_SKILLS
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
    """Extract education entries — degree/institution lines only."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = []
    for line in lines:
        lowered = line.lower()
        # Skip section headers
        if lowered in ('education', 'academic background', 'qualification'):
            continue
        # Skip objective/seeking/summary/interest lines
        if any(kw in lowered for kw in ('seeking', 'looking for', 'objective',
                                         'aspiring', 'passionate', 'motivated',
                                         'career goal', 'summary', 'interest in',
                                         'strong interest', 'experience in',
                                         'working on', 'supervised')):
            continue
        # Skip lines that are too long (likely descriptions, not degree names)
        if len(line) > 100:
            continue
        # Skip lines with many commas (skill listings like "Python, Java, SQL")
        if line.count(',') >= 3:
            continue
        # Skip lines that look like skill categories ("Engineering System Design, ...")
        if any(cat in lowered for cat in ('system design', 'performance', 'observability',
                                           'security', 'testing', 'optimization')):
            continue
        if any(kw in lowered for kw in EDUCATION_KEYWORDS):
            if len(line) > 10:
                matches.append(line[:150])
    return matches[:3]


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
                                    'certificates', 'training', 'courses',
                                    'certifications & activities',
                                    'certificates & activities',
                                    'certifications and activities'):
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
    """Extract work experience entries — looks for job titles, company names, and date ranges."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    role_pattern = re.compile(
        r'(developer|engineer|intern|analyst|designer|manager|lead|consultant|'
        r'trainee|associate|specialist|coordinator|supervisor|freelanc|'
        r'administrator|technician|officer|executive|scientist|researcher)',
        re.IGNORECASE
    )
    company_pattern = re.compile(
        r'(at|@|,)\s+[A-Z][a-zA-Z\s]+',
        re.IGNORECASE
    )
    year_pattern = re.compile(r'(20\d{2}|19\d{2})')
    date_range_pattern = re.compile(r'(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|present|current|now)', re.IGNORECASE)
    matches = []
    
    # Track if we're in an experience section
    in_experience_section = False

    for i, line in enumerate(lines):
        lowered = line.lower()
        
        # Detect experience section headers
        if lowered.rstrip(':') in ('experience', 'work experience',
                                    'professional experience', 'internship',
                                    'internships', 'employment', 'work history',
                                    'experience / training', 'professional experience',
                                    'training', 'experience/training'):
            in_experience_section = True
            continue
        
        # Detect other section headers (end of experience section)
        if lowered.rstrip(':') in ('education', 'academic background', 'qualification',
                                    'skills', 'certifications', 'projects', 'achievements',
                                    'awards', 'hobbies', 'interests', 'references',
                                    'objective', 'summary', 'contact', 'languages'):
            in_experience_section = False
            continue
        
        # Skip education entries (contains degree keywords)
        if any(kw in lowered for kw in ('bachelor', 'master', 'b.tech', 'b.e.', 'mba',
                                         'bsc', 'msc', 'phd', 'diploma', 'bca', 'pursuing',
                                         'b.sc', 'm.tech', 'degree', 'university', 'college',
                                         'campus', '+2', 'higher secondary', 'csit')):
            continue
        # Also skip "BE " or "BSc " at start of line (common education format)
        if re.match(r'^(BE|BSc|MSc|BCA|MCA|MBA|BTech|MTech)\s', line):
            continue
        # Skip certification lines
        if any(kw in lowered for kw in CERTIFICATION_KEYWORDS):
            continue
        # Skip lines mentioning cloud certifications (often misdetected as experience)
        if any(kw in lowered for kw in ('aws certified', 'google cloud', 'azure fundamentals',
                                         'cka certified', 'mongodb certified', 'microsoft certified')):
            continue
        # Skip objective/seeking lines
        if any(kw in lowered for kw in ('seeking', 'looking for', 'objective', 'aspiring',
                                         'passionate about', 'motivated', 'strong interest',
                                         'interest in', 'experience in')):
            continue
        # Skip student/summary description lines
        if 'student' in lowered and ('year' in lowered or 'campus' in lowered or 'interest' in lowered):
            continue
        # Skip lines > 90 chars that look like descriptions (not job titles)
        if len(line) > 90 and not re.search(r'(20\d{2}\s*[-–]\s*(20\d{2}|present))', lowered):
            continue
        # Skip action/description lines (start with verbs) unless they contain a role
        action_verbs = ('developed', 'built', 'created', 'implemented', 'designed',
                       'deployed', 'integrated', 'managed', 'maintained', 'optimized',
                       'used', 'worked on', 'responsible for', 'contributed',
                       'led', 'conducted', 'performed', 'assisted', 'collaborated',
                       'improved', 'reduced', 'increased', 'automated', 'wrote',
                       'tested', 'debugged', 'resolved', 'configured', 'monitored',
                       'supervised', 'supported', 'coordinated', 'organized',
                       'handled', 'analyzed', 'researched', 'published',
                       'worked', 'served', 'participated', 'mentored', 'owned',
                       'introduced', 'architected', 'partnered', 'delivered')
        stripped_lower = lowered.lstrip('•·-– ')
        if any(stripped_lower.startswith(v) for v in action_verbs):
            # Only keep if it STARTS with a role title (not just contains one somewhere)
            if not re.match(r'^(senior |junior |lead )?(software |web |backend |frontend |full stack |mobile |data |devops |qa )?(developer|engineer|intern|analyst|designer|manager|lead|consultant)', stripped_lower):
                continue
        # Skip very short lines and bullet symbols
        cleaned_line = line.lstrip('•·-–— ')
        if len(cleaned_line) < 8:
            continue
        # Skip skill listing lines (many commas)
        if line.count(',') >= 3:
            continue
        
        has_role = role_pattern.search(line)
        has_date_range = date_range_pattern.search(line)
        has_year = year_pattern.search(line)
        has_company = company_pattern.search(line)
        
        # Strong match: role keyword + date range
        if has_role and has_date_range:
            matches.append(cleaned_line[:150])
        # Good match: role keyword + company indicator
        elif has_role and has_company and len(line) > 15:
            matches.append(cleaned_line[:150])
        # Context-aware: in experience section with role or date
        elif in_experience_section:
            if has_role and len(line) > 12:
                matches.append(cleaned_line[:150])
            elif has_date_range and len(line) > 12:
                matches.append(cleaned_line[:150])
            elif has_year and 'present' in lowered and has_role:
                matches.append(cleaned_line[:150])
        # Standalone match: role keyword but NOT in education context
        elif has_role and len(line) > 15 and not in_experience_section:
            # Only if line doesn't look like an education entry
            if has_year or has_company:
                matches.append(cleaned_line[:150])
    
    # Deduplicate
    seen = set()
    unique = []
    for m in matches:
        key = m.lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(m)
    
    return unique[:5]


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
        # Contains slash or year range
        if '/' in org or re.search(r'\d{4}', org):
            continue
        # Is a skill
        if org.lower() in skills:
            continue
        # Tech extensions
        if any(ext in org for ext in ['.js', '.py', '.ts', '.net', '.io', 'API', 'ML']):
            continue
        # Contains role keywords (NER false positive on job title lines)
        role_words = ['intern', 'developer', 'engineer', 'designer', 'manager',
                      'analyst', 'consultant', 'lead', 'specialist']
        if any(w in org.lower() for w in role_words):
            continue
        # Bad keywords
        bad = ['engineering', 'computer', 'science', 'technology', 'position',
               'rank', 'built', 'developed', 'model', 'predict', 'using',
               'based', 'system', 'platform', 'hackathon', 'project',
               'learning', 'certificate', 'stack', 'fastapi', 'mern',
               'fast', 'men', 'anc', 'tensor', 'random', 'forest',
               'opencv', 'sklearn', 'pytorch', 'keras', 'numpy', 'pandas',
               'scipy', 'matplotlib', 'flask', 'django']
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


def extract_person_ner(doc) -> list:
    """Extract person name using spaCy NER (PERSON entity)."""
    persons = []
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            # Clean: remove newlines and extra whitespace
            name = ' '.join(ent.text.split()).strip()
            # Valid name: 2-4 words, reasonable length, no tech terms
            words = name.split()
            if 2 <= len(words) <= 4 and 3 < len(name) < 40:
                # Skip if contains tech keywords
                tech = {'api', 'css', 'html', 'sql', 'rest', 'mern', 'react',
                        'node', 'python', 'java', 'c++', 'git', 'linux', 'docker',
                        'stack', 'intern', 'campus', 'engineer', 'senior', 'junior',
                        'software', 'developer', 'manager', 'lead', 'architect'}
                if not any(t in name.lower() for t in tech):
                    persons.append(name)
    return persons[:2]


def extract_dates_ner(doc) -> list:
    """Extract dates using spaCy NER (DATE entity)."""
    dates = []
    for ent in doc.ents:
        if ent.label_ == "DATE":
            date_text = ent.text.strip()
            # Keep meaningful dates (years, month-year combos)
            if re.search(r'(20\d{2}|19\d{2})', date_text):
                if len(date_text) < 30:  # Skip overly long date strings
                    dates.append(date_text)
    # Deduplicate and sort
    return sorted(set(dates))[:6]


def extract_entities(text: str) -> dict:
    """
    Main extraction function using hybrid approach:
    - spaCy NER for: PERSON, ORG, GPE, DATE entities
    - Pattern/Regex for: email, phone, skills, education, experience, certifications
    
    The hybrid approach combines statistical NER with deterministic patterns
    for maximum accuracy on resume documents.
    """
    # Clean PDF artifacts
    cleaned = clean_pdf_text(text)

    # =========================================================
    # STEP 1: Run spaCy NER on cleaned text (statistical NLP)
    # =========================================================
    doc = get_nlp()(cleaned)
    
    # NER-based extraction
    ner_persons = extract_person_ner(doc)
    raw_orgs = sorted({ent.text for ent in doc.ents if ent.label_ == "ORG"})
    raw_locations = sorted({ent.text for ent in doc.ents if ent.label_ == "GPE"})
    ner_dates = extract_dates_ner(doc)

    # =========================================================
    # STEP 2: Pattern-based extraction (deterministic, reliable)
    # =========================================================
    emails = sorted(set(EMAIL_PATTERN.findall(text)))
    phones = sorted(set(
        p for p in PHONE_PATTERN.findall(text)
        if not YEAR_RANGE_PATTERN.match(p.strip()) and len(re.sub(r'\D', '', p)) >= 7
    ))
    skills = extract_skills(cleaned)
    education = extract_education(text)
    certifications = extract_certifications(text)
    experience = extract_experience(text)

    # =========================================================
    # STEP 3: Person name — NER first, heuristic fallback
    # =========================================================
    # Tech terms that should NEVER be detected as a name
    tech_not_names = {'javascript', 'typescript', 'python', 'react', 'angular', 'vue',
                      'node', 'django', 'flask', 'fastapi', 'express', 'mongodb',
                      'postgresql', 'mysql', 'docker', 'kubernetes', 'linux', 'git',
                      'html', 'css', 'aws', 'azure', 'redis', 'graphql', 'rest',
                      'java', 'kotlin', 'swift', 'flutter', 'tensorflow', 'pytorch',
                      'jupyter', 'jupyternotebook', 'notebook', 'postman', 'vscode',
                      'numpy', 'pandas', 'matplotlib', 'vite', 'tailwind'}
    
    person = ner_persons  # Prefer NER-detected names
    
    # Filter out tech terms from NER results
    person = [p for p in person if p.lower().replace(' ', '') not in tech_not_names]
    
    if not person:
        # Fallback: use the FIRST non-empty line that looks like a name
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for line in lines[:5]:
            line = line.strip()
            if '@' in line or 'http' in line or ':' in line:
                continue
            if any(line.lower().startswith(h) for h in ['objective', 'summary', 'profile', 'address', 'contact']):
                continue
            if PHONE_PATTERN.search(line):
                continue
            # Skip if it looks like a tech term (even with broken spaces)
            joined = line.lower().replace(' ', '')
            if joined in tech_not_names:
                continue
            words = line.split()
            if 2 <= len(words) <= 4 and len(line) < 40 and len(line) > 3:
                if all(w[0].isupper() for w in words if w):
                    name = re.sub(r'\s+', ' ', line).strip()
                    person = [name]
                    break
        
        # Last fallback: first line if short enough and not a tech term
        if not person and lines:
            first_line = lines[0].strip()
            joined_first = first_line.lower().replace(' ', '')
            if (len(first_line) < 40 and '@' not in first_line and 
                'http' not in first_line and joined_first not in tech_not_names):
                name = re.sub(r'\s+', ' ', first_line).strip()
                if len(name.split()) <= 4 and len(name) > 3:
                    # Final check: must have at least 2 words that look like names
                    words = name.split()
                    if len(words) >= 2 and all(w[0].isupper() and w.isalpha() for w in words):
                        person = [name]

    # =========================================================
    # STEP 4: Filter NER-extracted orgs and locations
    # =========================================================
    skills_set = set(skills)
    organizations = filter_organizations(raw_orgs, skills_set)
    locations = filter_locations(raw_locations)

    # Clean null bytes and fix remaining broken words in output
    def clean(items):
        cleaned = []
        for item in items:
            if not item or not str(item).strip():
                continue
            s = str(item).replace('\x00', '').strip()
            # Apply display cleaning to fix broken words in output
            s = clean_display_text(s)
            if s:
                cleaned.append(s)
        return cleaned

    return {
        "person": clean(person),
        "email": clean(emails),
        "phone": clean(phones[:3]),
        "organizations": clean(organizations),
        "locations": clean(locations),
        "dates": clean(ner_dates),
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

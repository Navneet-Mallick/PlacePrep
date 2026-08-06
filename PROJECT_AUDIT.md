# PlacementPrep — Project Audit

**Audit Date:** August 6, 2026  
**Auditor Role:** Lead Software Architect  
**Scope:** Full repository review against `PROJECT_CONTEXT.md` and approved project proposal  
**Code changes during audit:** None

---

## Executive Summary

PlacementPrep is a **functional prototype** with working UI shells, a monolithic Django REST API, a separate FastAPI ML microservice, and core ML scripts for resume analysis and technical answer scoring. The project demonstrates the intended product vision but is **not yet production-ready** or fully aligned with the target architecture.

**Overall completion estimate:** ~45–55% of the approved specification.

| Area | Status |
|------|--------|
| Frontend (React + Tailwind) | Partial — pages exist, gaps in routing, charts, and API integration |
| Backend (Django REST) | Partial — single `api` app, no service layer, thin but overloaded views |
| Database (PostgreSQL) | Not enforced — SQLite is the default; schema is simplified vs. spec |
| ML Layer | Partial — resume + technical pipelines exist; aptitude ML missing; models not shipped |
| Authentication | Partial — JWT works; profile management and route protection incomplete |
| Testing | Minimal — ML script tests only; no Django/API tests |
| Documentation | Partial — team guides exist; no root README or architecture/API docs |

---

## 1. Repository Structure (Current)

```
Minor-Project-main/
├── frontend/              # React (Vite) + Tailwind — Port 5173
├── api/                   # Single Django app (all backend logic) — Port 8001
├── config/                # Django project settings
├── ml/
│   ├── api/server.py      # FastAPI ML server — Port 8000
│   ├── scripts/           # NLP, training, evaluation scripts
│   └── data/              # Aptitude question JSON
├── Datasets/              # Resume, aptitude, technical CSV datasets
├── PROJECT_CONTEXT.md
├── START_HERE.md, TEAM_TESTING.md, GITHUB_SETUP.md
└── test_platform.py       # ML integration smoke tests (not Django API tests)
```

**Target structure (from spec):** Modular `apps/` with `accounts/`, `resume/`, `aptitude/`, `technical/`, `dashboard/`, `recommendation/`, `analytics/` — **not implemented**.

**Referenced but missing:** `AI_CONTEXT/` folder (10 specification documents listed in `PROJECT_CONTEXT.md`).

---

## 2. Current Status by Module

### Module 1: Authentication — **~60% Complete**

#### Implemented
- User registration (`POST /api/auth/register/`) with password confirmation validation
- Email-based login (`POST /api/auth/login/`) returning JWT access + refresh tokens
- JWT token obtain (`POST /api/auth/token/`) and refresh (`POST /api/auth/refresh/`)
- Profile read (`GET /api/auth/profile/`) — authenticated
- `rest_framework_simplejwt` configured (24h access, 7d refresh)
- Frontend Login and Register pages with token storage in `localStorage`
- Axios interceptor for automatic token refresh on 401

#### Partial / Broken
- **No profile update** endpoint (PUT/PATCH)
- **No dedicated Profile page** in frontend
- **No route guards** — protected pages (`/dashboard`, `/resume`, etc.) are reachable without login; nav hides links but URLs work
- Login response shape mismatch: frontend reads `response.data.username` / `response.data.name`, but API returns nested `response.data.user`
- Duplicate `get_token` method in `CustomTokenObtainPairSerializer` (dead code)
- Social login buttons (Google/GitHub) are UI-only placeholders
- Forgot password not implemented

#### Missing
- Role-based permissions (student vs admin beyond Django admin)
- Email verification
- Secure httpOnly cookie option for tokens
- Automated API tests for auth flows

---

### Module 2: Resume Analysis — **~55% Complete**

#### Implemented
- PDF and DOCX text extraction (`ml/scripts/extract_text.py`)
- spaCy NER + regex/pattern entity extraction (`extract_entities.py`)
  - Person, email, phone, skills, education, certifications, experience
- TF-IDF + Logistic Regression training script (`train_resume_classifier.py`)
- Role prediction script (`predict_role.py`)
- End-to-end analysis pipeline (`analyze_resume.py`)
- Rule-based resume scoring (completeness heuristic)
- Improvement suggestions (rule-based)
- Gemini-powered recommendations (`gemini_recommendations.py`) with safe fallback
- FastAPI endpoint: `POST /api/resume/analyze`
- Django `Resume` model and upload endpoint (`POST /api/resumes/`)
- Frontend Resume Upload page with results display

#### Partial
- **Frontend bypasses Django** — `ResumeUpload.jsx` calls ML API directly via `resumeAPI.analyze()`, not `resumeAPI.upload()`. Results are **not persisted** to the database unless user separately uses backend upload
- **Field mapping bug in Django view:** ML returns `resume_score` but view reads `ml_result.get('score', 0)` → stored score is always 0
- **Missing `parsed_text` in ML response** — Django stores empty parsed text
- **Entity key mismatch:** ML returns `entities`; view maps correctly, but score/suggestions not stored
- Trained model file **not present in repo** (`ml/models/` directory missing); `predict_role.py` will fail without manual training
- Model saved as `resume_role_classifier.joblib`, spec requires `models/resume_classifier.pkl`
- Projects entity extraction **not implemented** (spec requires projects)
- Missing skills vs. role requirements not computed (only Gemini suggestions)

#### Missing
- Normalized DB models: `ResumeAnalysis`, `ExtractedEntity`, `JobPrediction` (currently JSON blobs on `Resume`)
- Dedicated **Resume Report** page (analysis is inline on upload page)
- Django **service layer** for orchestration
- ML evaluation metrics persisted (accuracy, precision, recall, F1)
- Backend tests for upload and analysis

---

### Module 3: Aptitude Assessment — **~50% Complete**

#### Implemented
- `AptitudeQuestion` and `AptitudeTestAttempt` models
- Question bank load scripts (`load_aptitude_questions.py`, `load_questions_to_db.py`, management command)
- Dataset files under `Datasets/Aptitude/` and `ml/data/aptitude_questions.json`
- API: list questions, filter by section, submit attempt, history
- Frontend: section selection, question navigation, tab-switch proctoring, results display
- Section scores and aptitude level stored per attempt

#### Partial
- **Aptitude level uses hardcoded thresholds** (80/60/100), not Random Forest classifier as specified
- **No `train_aptitude_classifier.py`** or `aptitude_classifier.pkl` anywhere in codebase
- Section naming mismatch: spec requires **Verbal**; implementation uses **technical/CSE** as third section
- **No timer UI** — `time_taken` is recorded but no countdown or time limit enforcement
- **No random question selection** — all questions in a section are loaded
- Scoring logic scores against **all questions in DB for each section**, not just the questions presented in the test session (inflated/deflated scores when partial sections taken)
- Aptitude question endpoints are **`AllowAny`** — unauthenticated access to full question bank

#### Missing
- Random Forest training script and saved model
- Verbal ability section
- Per-attempt question set tracking (which questions were served)
- ML metrics documentation for aptitude classifier
- API tests

---

### Module 4: Technical Assessment — **~45% Complete**

#### Implemented
- `TechnicalQuestion` and `TechnicalAnswer` models with categories (DSA, DBMS, OS, CN, Git, Web)
- TF-IDF + cosine similarity scoring (`evaluate_technical_answer.py`)
- FastAPI endpoint: `POST /api/technical/evaluate`
- Django answer submission with ML integration and fallback
- Frontend category selection, subjective textarea, per-question evaluation display
- Weak area detection on dashboard (categories with avg score < 70)

#### Partial
- **MCQ question type not implemented** — all questions are subjective only
- **Reference answers exposed to frontend** — `TechnicalTest.jsx` renders `question.reference_answer`; serializer excludes it from API but frontend receives it if serializer/API is inconsistent (ReadOnlyModelViewSet sends full serializer fields — actually TechnicalQuestionSerializer excludes reference_answer, so the frontend check at line 264 may never show — but this indicates incomplete MCQ/subjective type split)
- No timed technical assessment mode
- No aggregated "technical test attempt" — answers are one-off per question
- Subjective dataset exists (`Datasets/Subjective Question Dataset/`) but loading into DB may be incomplete/manual

#### Missing
- Question type field (MCQ vs subjective)
- Structured feedback on weak topics beyond category averages
- Technical attempt session model
- API and model tests

---

### Module 5: Dashboard — **~40% Complete**

#### Implemented
- `GET /api/dashboard/stats/` aggregating resume, aptitude, technical, weak areas, recommendations
- Frontend Dashboard with metric cards, recent history snippets, weak areas, recommendations section
- Loading and error states

#### Partial
- **No charts** — spec requires Chart.js/Recharts; neither is in `package.json`
- **No performance history charts** over time
- **No skill gap analysis** visualization
- Recommendations on dashboard read from `Recommendation` model, which is **never populated** by any backend logic
- Dashboard recommendation display expects `rec.message` but serializer field is `recommendation_text`
- History is embedded in dashboard; no dedicated **History** page

#### Missing
- `PerformanceRecord` model
- Progress trends (line/bar charts)
- Unified analytics app
- React Query for cached/refetched dashboard data (listed in spec, not used)

---

### Module 6: Recommendation Engine — **~20% Complete**

#### Implemented
- `Recommendation` model with categories (missing_skill, learning_path, practice_focus, resume)
- Read-only API (`GET /api/recommendations/`)
- Gemini-based recommendations generated at **ML analysis time** (not persisted)
- Fallback suggestions in `analyze_resume.py` when Gemini unavailable

#### Missing
- **Rule-based recommendation engine** in Django (primary spec requirement)
- Logic to create `Recommendation` records after resume/aptitude/technical events
- Career guidance synthesis from combined performance data
- Architecture hooks documented for future LLM integration (partially present in ML layer only)
- Frontend dedicated recommendations view beyond dashboard snippet

---

### Module 7: Frontend (Overall) — **~55% Complete**

#### Pages Present
| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | Complete (polished hero + features) |
| Login | `/login` | Complete |
| Register | `/register` | Complete |
| Dashboard | `/dashboard` | Partial (no charts) |
| Resume Upload | `/resume` | Partial (not persisted via backend) |
| Aptitude Test | `/aptitude` | Partial |
| Technical Test | `/technical` | Partial |
| Code Practice | `/practice` | Extra (not in core spec; uses ML python executor) |

#### Pages Missing
- **Resume Report** (dedicated view for saved analyses)
- **Profile** (view/edit user info)
- **History** (full assessment history)
- **Admin Panel** (frontend; Django admin exists at `/admin/`)

#### UI/UX Gaps
- No reusable component library structure (`components/` only has `Layout.jsx`)
- No global auth context — each page reads `localStorage` independently
- Layout auth state does not update after login without refresh/navigation
- Hardcoded API URLs (`localhost:8000`, `localhost:8001`)
- No React Query despite spec mention
- Responsive design is generally good (Tailwind grid breakpoints used)

---

### Module 8: Machine Learning — **~50% Complete**

#### Implemented
| Component | Script | Model | Metrics |
|-----------|--------|-------|---------|
| Resume role classifier | `train_resume_classifier.py` | `resume_role_classifier.joblib` (not in repo) | `classification_report` printed only |
| Entity extraction | `extract_entities.py` | spaCy `en_core_web_sm` | None |
| Technical scoring | `evaluate_technical_answer.py` | Runtime TF-IDF | None |
| Recommendations | `gemini_recommendations.py` | Gemini API | N/A |

#### Missing
| Component | Required |
|-----------|----------|
| Aptitude Random Forest classifier | `train_aptitude_classifier.py`, `aptitude_classifier.pkl` |
| Standardized model paths | `models/resume_classifier.pkl`, `models/aptitude_classifier.pkl` |
| Evaluation metrics export | accuracy, precision, recall, F1 saved to file/docs |
| Model tests | Automated tests for loaded models |
| Django ML service integration | ML called via HTTP from views, not isolated service layer |

#### ML Architecture Note
Current flow uses a **standalone FastAPI server** instead of the specified **Python ML service layer** invoked from Django's service layer. This works for development but diverges from the target architecture:

```
Target:   React → Django REST → Service Layer → DB + ML Models
Current:  React → Django REST → HTTP → FastAPI ML  (and React → FastAPI directly for resume)
```

---

## 3. Database Schema — Current vs. Required

### Current Models (in single `api` app)
- Uses Django built-in `User` (no `Profile` extension)
- `Resume` — file + analysis fields as JSON
- `AptitudeQuestion`, `AptitudeTestAttempt`
- `TechnicalQuestion`, `TechnicalAnswer`
- `Recommendation`

### Required Models (from spec) — Gap Analysis

| Required Model | Status |
|----------------|--------|
| User | Using Django default |
| Profile | Missing |
| Resume | Exists (simplified) |
| ResumeAnalysis | Missing (merged into Resume) |
| ExtractedEntity | Missing (JSON on Resume) |
| JobPrediction | Missing (fields on Resume) |
| AptitudeQuestion | Exists |
| AptitudeAttempt | Exists as `AptitudeTestAttempt` |
| TechnicalQuestion | Exists (no MCQ type) |
| TechnicalAttempt | Missing (per-answer only) |
| PerformanceRecord | Missing |
| Recommendation | Exists (never populated) |

### Database Configuration
- **PostgreSQL supported but not default** — `DB_ENGINE=sqlite` is the default in `settings.py`
- No migration strategy documented for PostgreSQL setup
- JSON fields used heavily instead of normalized relations (acceptable for MVP, not ideal for analytics)

---

## 4. Architecture Problems

1. **Monolithic `api` app** — All models, views, serializers in one app; violates modular `apps/` structure from spec.
2. **No service layer** — Business logic, scoring, and ML orchestration live directly in `views.py` (~460 lines).
3. **Dual ML integration paths** — Django calls ML via HTTP; frontend also calls ML directly for resume analysis.
4. **Three-server dev setup** — Django (8001) + FastAPI (8000) + Vite (5173) with no Docker/process orchestration.
5. **Tight localhost coupling** — `ML_API_URL = 'http://localhost:8000/api'` hardcoded in views and frontend.
6. **Missing AI_CONTEXT documentation** — Architecture/API/DB specs referenced in `PROJECT_CONTEXT.md` do not exist in repo.
7. **Bloated root `requirements.txt`** — 240+ packages (includes unrelated tools: ultralytics, panda3d, streamlit, langchain) making reproducible installs fragile.

---

## 5. Security Issues

| Severity | Issue | Location |
|----------|-------|----------|
| **High** | Python code execution endpoint with subprocess | `ml/api/server.py` `/api/python/execute` — arbitrary code execution risk |
| **High** | Default insecure `SECRET_KEY` in settings fallback | `config/settings.py` |
| **Medium** | JWT tokens in `localStorage` (XSS exposure) | Frontend auth |
| **Medium** | Aptitude/technical question APIs allow unauthenticated read | `views.py` `AllowAny` |
| **Medium** | Demo credentials documented in UI | `Login.jsx`, `START_HERE.md` |
| **Medium** | No file size limits on resume upload | `ResumeViewSet.create` |
| **Medium** | No rate limiting on auth or ML endpoints | Global |
| **Low** | CORS limited to localhost (OK for dev) | `settings.py`, FastAPI |
| **Low** | `.env.example` only documents `GEMINI_API_KEY` — missing `SECRET_KEY`, DB vars | `.env.example` |
| **Low** | DEBUG defaults to `True` | `settings.py` |

---

## 6. Code Quality Issues

1. **Empty Django tests** — `api/tests.py` contains only a placeholder comment.
2. **Inconsistent API response keys** — ML uses `resume_score`; Django view expects `score`.
3. **Duplicate serializer method** — `CustomTokenObtainPairSerializer.get_token` defined twice.
4. **No pagination handling in frontend** — Dashboard assumes `data.results` from paginated endpoints.
5. **No input validation serializers** for aptitude/technical submission payloads (raw `request.data` access).
6. **Exception swallowing** — Broad `except Exception` in views returns generic errors.
7. **Mixed concerns in frontend pages** — Large single-file components (380+ lines AptitudeTest).
8. **Utility scripts at repo root** — `create_user.py`, `register_user.py`, `load_questions_to_db.py` overlap with management commands.
9. **No CI/CD configuration** — No GitHub Actions, pre-commit, or linting for Python backend.
10. **Frontend ESLint configured but no test framework** — No Jest/Vitest tests.

---

## 7. Documentation Status

| Document | Status |
|----------|--------|
| `PROJECT_CONTEXT.md` | Present |
| `START_HERE.md` | Present — onboarding guide |
| `TEAM_TESTING.md` | Present — setup and testing |
| `GITHUB_SETUP.md` | Present |
| Root `README.md` | **Missing** |
| Installation guide | Partial (in TEAM_TESTING.md only) |
| Database setup guide | **Missing** (PostgreSQL) |
| API documentation | **Missing** (OpenAPI/Swagger referenced in root URL but not configured) |
| Architecture documentation | **Missing** |
| ML documentation | **Missing** (training/evaluation not documented) |
| Deployment instructions | **Missing** |
| `AI_CONTEXT/` folder | **Missing** (10 files referenced) |

---

## 8. Testing Status

| Test Type | Status |
|-----------|--------|
| ML smoke tests | `test_platform.py` — NER, resume analysis, role prediction, technical scoring |
| Gemini integration test | `test_gemini.py` |
| Django unit tests | None |
| DRF API tests | None |
| Model evaluation tests | None |
| Frontend tests | None |
| E2E tests | None |

`test_platform.py` validates ML scripts in isolation; it does **not** verify Django APIs, authentication, database persistence, or frontend integration.

---

## 9. Missing Features (Consolidated)

### Critical (blocks spec compliance)
- Modular Django apps with service layer
- PostgreSQL as default/production database
- Trained ML models committed or documented download/train step in CI
- Aptitude Random Forest classifier
- Resume upload persistence through Django (single pipeline)
- Rule-based recommendation engine with DB persistence
- Backend and API test suite
- Root README and architecture documentation

### High Priority
- Profile model and profile management API + page
- Route protection (authenticated routes)
- Resume Report page
- History page
- Dashboard charts (performance over time)
- Fix resume score / parsed_text field mapping bugs
- Random aptitude questions with timer
- MCQ support for technical assessment
- Normalized schema (ResumeAnalysis, ExtractedEntity, PerformanceRecord)
- Environment variable documentation (`.env.example` complete)

### Medium Priority
- Verbal aptitude section (replace or supplement technical/CSE section)
- Skill gap analysis module
- Admin frontend panel
- React Query integration
- Remove or sandbox Python code execution endpoint
- Trim `requirements.txt` to project-relevant packages
- OpenAPI/Swagger via drf-spectacular
- Docker Compose for 3-service dev stack

### Low Priority / Future
- LLM integration architecture (beyond Gemini resume recommendations)
- Social OAuth login
- Email verification and password reset
- Notifications app
- Code Practice module integration with dashboard

---

## 10. Recommended Improvements

### Architecture
1. Split `api/` into domain apps under `apps/` as specified.
2. Introduce `services/` modules per app; views should only handle HTTP concerns.
3. Consolidate ML access through Django service layer — remove direct frontend → FastAPI calls.
4. Consider embedding ML as importable Python modules within Django for simpler deployment, keeping training scripts separate.
5. Add `docker-compose.yml` for PostgreSQL + Django + ML + Frontend.

### Data Layer
1. Add `Profile` model (OneToOne with User): phone, college, branch, graduation year, target role.
2. Extract `ResumeAnalysis`, `ExtractedEntity`, `JobPrediction` from monolithic Resume JSON.
3. Add `PerformanceRecord` for time-series dashboard analytics.
4. Add `TechnicalAttempt` to group answers into sessions.

### ML Pipeline
1. Run training scripts; commit models or add `make train` / setup step.
2. Rename models to spec convention (`resume_classifier.pkl`, `aptitude_classifier.pkl`).
3. Export metrics to `ml/reports/` as JSON/markdown.
4. Implement aptitude feature extraction + Random Forest training from attempt data or dataset labels.
5. Add missing skills detection using role–skill matrix (rule-based, no LLM required).

### API Quality
1. Fix ML response mapping in `ResumeViewSet.create`.
2. Add serializers for aptitude/technical submission.
3. Restrict question endpoints to authenticated users (or serve limited random subsets).
4. Add profile update endpoint.
5. Post-analysis hook to populate `Recommendation` records.
6. Configure drf-spectacular for auto-generated API docs at `/api/docs/`.

### Frontend
1. Add auth context provider and protected route wrapper.
2. Unify resume flow: upload → Django → ML → persist → redirect to Report.
3. Add Chart.js or Recharts to dashboard.
4. Build Profile, History, and Resume Report pages.
5. Use `VITE_API_URL` and `VITE_ML_API_URL` consistently; remove hardcoded localhost.

### Security & DevOps
1. Remove or heavily restrict `/api/python/execute`.
2. Require explicit `SECRET_KEY` in production (no insecure default).
3. Add file upload size limits and content validation.
4. Expand `.env.example` with all required variables.
5. Add GitHub Actions: lint, `python manage.py test`, `pytest ml/`, frontend build.

---

## 11. Development Priority List

Ordered for incremental delivery aligned with the spec roadmap.

### Phase 1 — Foundation (Week 1)
| Priority | Task | Rationale |
|----------|------|-----------|
| P0 | Fix resume upload pipeline (Django ↔ ML field mapping, persist results) | Core feature broken for backend/dashboard |
| P0 | Add root `README.md` + complete `.env.example` | Team and evaluator onboarding |
| P0 | Train and ship resume classifier model; document train step | Role prediction fails on fresh clone |
| P1 | Add auth context + protected routes in frontend | Security baseline |
| P1 | Add Django API tests for auth, resume upload, dashboard | Quality gate |
| P1 | Switch default DB documentation to PostgreSQL; keep SQLite for local dev | Spec compliance |

### Phase 2 — Architecture Refactor (Week 2)
| Priority | Task | Rationale |
|----------|------|-----------|
| P1 | Create `apps/accounts` with Profile model and profile CRUD | Spec schema |
| P1 | Extract `apps/resume` with service layer | Maintainability |
| P1 | Remove direct frontend → ML calls | Single integration path |
| P2 | Split aptitude, technical, dashboard, recommendation apps | Modular architecture |

### Phase 3 — ML Completion (Week 2–3)
| Priority | Task | Rationale |
|----------|------|-----------|
| P0 | Implement aptitude Random Forest training + integration | Spec requirement |
| P1 | Add ML metrics export (accuracy, precision, recall, F1) | Academic evaluation |
| P1 | Rule-based recommendation engine in Django | Spec requirement |
| P2 | Missing skills + role–skill matrix | Resume analysis completeness |
| P2 | Add projects extraction to NER pipeline | Spec entity list |

### Phase 4 — Assessment Improvements (Week 3)
| Priority | Task | Rationale |
|----------|------|-----------|
| P1 | Aptitude: random questions, timer, fix scoring to session questions only | Correct assessment behavior |
| P1 | Technical: add MCQ question type | Spec requirement |
| P2 | Add Verbal section or rename/document section mapping | Spec alignment |
| P2 | Technical attempt sessions | Better analytics |

### Phase 5 — Dashboard & UI (Week 3–4)
| Priority | Task | Rationale |
|----------|------|-----------|
| P1 | Dashboard charts (aptitude/technical/resume over time) | Spec requirement |
| P1 | Resume Report, Profile, History pages | Spec page list |
| P2 | Skill gap analysis panel | Spec requirement |
| P2 | Reusable UI components | Code quality |

### Phase 6 — Quality & Deployment (Week 4)
| Priority | Task | Rationale |
|----------|------|-----------|
| P1 | API documentation (OpenAPI) | Spec requirement |
| P1 | Architecture + ML documentation | Academic evaluation |
| P1 | Docker Compose + deployment guide | Reproducible demo |
| P2 | Trim requirements.txt | Maintainability |
| P2 | Security hardening (remove code exec, rate limits) | Production readiness |
| P3 | CI pipeline | Engineering best practice |

---

## 12. What Works Today (Demo-Ready Paths)

When all three servers are running and the resume model is trained locally:

1. **Register / Login** — Creates user and returns JWT tokens.
2. **Resume analysis (ML direct)** — Upload PDF/DOCX on `/resume` for score, role, entities, Gemini recommendations.
3. **Aptitude test** — Select section, answer questions, submit for score and level.
4. **Technical assessment** — Select category, submit subjective answer, receive TF-IDF score.
5. **Dashboard** — Shows aggregated stats if data was saved via Django endpoints.
6. **Django admin** — Manage questions, resumes, attempts.
7. **`python test_platform.py`** — Validates ML script functionality.

---

## 13. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| ML models not in repo | Clone fails role prediction | Document train step; add setup script |
| Resume not persisted via UI | Dashboard empty after analysis | Fix frontend to use Django upload |
| SQLite in production | Data/scaling issues | Enforce PostgreSQL for deployment |
| Bloated dependencies | Install failures | Split dev/prod requirements |
| Code execution endpoint | Security vulnerability | Remove or restrict to admin sandbox |
| No automated tests | Regressions during refactor | Add tests before major restructuring |

---

## 14. Conclusion

PlacementPrep has a **solid prototype foundation**: the ML scripts demonstrate real NLP/ML capability, the React UI is visually polished, and the Django API covers most CRUD endpoints. The gap to a **complete, production-quality academic project** is primarily in **architecture discipline** (modular apps, service layer, unified data flow), **ML completeness** (aptitude classifier, shipped models, metrics), **integration correctness** (resume persistence bugs, recommendations never saved), **missing pages/features** (charts, profile, history, report), and **engineering rigor** (PostgreSQL, tests, documentation).

The recommended approach is **incremental transformation** — fix critical integration bugs first, then refactor into modular apps without rewriting working ML logic, and finally polish UI/documentation for evaluation.

---

*Next step: Begin Phase 1 (Foundation) — fix resume pipeline, add README, train models, and establish API tests.*

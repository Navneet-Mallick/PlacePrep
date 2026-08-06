# PROJECT_CONTEXT

## Project

**PlacementPrep -- ML-Based Resume Analysis & Aptitude Evaluation
System**

## Vision

A unified web platform integrating resume analysis, aptitude assessment,
technical assessment, performance analytics, job-role prediction, and
personalized recommendations.

## Goals

-   Resume upload and AI analysis
-   Job role prediction
-   Aptitude tests
-   Technical assessments
-   Dashboard and progress tracking
-   Admin management

## Tech Stack

### Frontend

-   React (Vite)
-   Tailwind CSS
-   React Router
-   Axios
-   React Query
-   Chart.js/Recharts

### Backend

-   Django
-   Django REST Framework
-   JWT Authentication
-   PostgreSQL

### ML

-   scikit-learn
-   spaCy
-   pandas
-   NumPy
-   PyMuPDF
-   pdfplumber
-   python-docx
-   joblib

## Architecture

React Frontend -\> Django REST API -\> PostgreSQL + ML Services

Modules: - Authentication - Resume Analysis - Technical Assessment -
Aptitude Assessment - Dashboard - Recommendation Engine

## Resume Pipeline

1.  Upload PDF/DOCX
2.  Extract text
3.  NLP preprocessing
4.  NER extraction
5.  TF-IDF
6.  Logistic Regression
7.  Resume score
8.  Job-role prediction
9.  Recommendations

## Aptitude

-   Quantitative
-   Logical
-   Verbal
-   Random Forest prediction
-   Beginner / Intermediate / Advanced

## Technical Assessment

-   MCQ
-   Subjective
-   TF-IDF + Cosine Similarity evaluation

## Dashboard

-   Resume score
-   Role prediction
-   Aptitude score
-   Technical score
-   Progress charts
-   Recommendations

## Backend Apps

accounts resume aptitude technical dashboard recommendation analytics
notifications common

## API Endpoints

/auth/* /resume/* /aptitude/* /technical/* /dashboard/\*

## Frontend Pages

Landing Login Register Dashboard Resume Upload Resume Report Aptitude
Test Technical Test History Profile Admin Panel

## Coding Standards

-   Service-layer architecture
-   Thin views/controllers
-   Validation via serializers
-   Modular ML code
-   Consistent JSON responses

## Development Roadmap

1.  Authentication
2.  Resume Analysis
3.  ML Pipeline
4.  Aptitude Module
5.  Technical Assessment
6.  Dashboard
7.  Recommendation Engine
8.  Testing
9.  Deployment

## AI Context Folder

AI_CONTEXT/ - 00_PROJECT_OVERVIEW.md - 01_SYSTEM_ARCHITECTURE.md -
02_DATABASE_SCHEMA.md - 03_API_SPECIFICATION.md - 04_FRONTEND_SPEC.md -
05_BACKEND_SPEC.md - 06_ML_PIPELINE.md - 07_UI_UX_GUIDELINES.md -
08_CODING_STANDARDS.md - 09_DEVELOPMENT_ROADMAP.md -
10_TASK_CHECKLIST.md - PROJECT_CONTEXT.md

## Notes

This document is the primary context for AI coding assistants
(Kiro/Cursor). Keep architecture modular, scalable, and aligned with the
approved proposal.

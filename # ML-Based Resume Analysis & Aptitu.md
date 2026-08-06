# ML-Based Resume Analysis & Aptitude Evaluation System

## Project Overview

This project aims to build a unified placement preparation platform that combines:

* Resume Analysis
* Aptitude Assessment
* Technical Skill Evaluation
* Performance Tracking
* Job Role Prediction
* Personalized Recommendations

The system is designed to help students prepare for internships and placement opportunities through automated evaluation and data-driven feedback.

---

# Problem Statement

Current career preparation platforms are fragmented. Students often use separate tools for:

* Resume screening
* Aptitude testing
* Technical assessments
* Coding practice
* Progress tracking

This project solves that problem by providing a single integrated platform that evaluates candidate readiness and provides actionable feedback.

---

# Core Objectives

## 1. Resume Analysis

Analyze uploaded resumes using:

* NLP
* Named Entity Recognition (NER)
* Machine Learning

Extract:

* Skills
* Education
* Certifications
* Experience

Generate:

* Resume score
* Improvement suggestions
* Job role prediction

---

## 2. Aptitude Assessment

Evaluate candidate aptitude through:

* Quantitative Reasoning
* Logical Reasoning
* Verbal Ability

Track:

* Accuracy
* Time Taken
* Section-wise Performance

Predict aptitude level:

* Beginner
* Intermediate
* Advanced

---

## 3. Technical Assessment

Assess technical knowledge in areas such as:

* Data Structures & Algorithms
* Database Management Systems
* Operating Systems
* Computer Networks
* Version Control (Git)
* Web Development

Evaluate subjective answers using NLP similarity techniques.

---

## 4. Performance Analytics

Provide a dashboard showing:

* Resume Performance
* Aptitude Scores
* Technical Scores
* Learning Progress
* Weak Areas
* Recommended Learning Paths

---

# Technology Stack

## Frontend

* React.js
* Tailwind CSS
* React Router
* Axios

### Responsibilities

* Authentication UI
* Resume Upload
* Assessment Interfaces
* Dashboard
* Progress Visualization

---

## Backend

* Django
* Django REST Framework

### Responsibilities

* Authentication
* Resume Processing
* ML Integration
* Assessment Evaluation
* Recommendation Engine
* REST APIs

---

## Database

* PostgreSQL

### Store

* User Information
* Resume Data
* Extracted Resume Entities
* Assessment Results
* Progress Records
* Predicted Roles
* Recommendations

---

# High-Level Architecture

```text
Frontend (React + Tailwind)
            |
            v
Backend API (Django REST)
            |
    --------------------
    |        |         |
 Resume   Assessment  Dashboard
 Module    Module      Module
    |        |         |
    --------------------
            |
            v
      PostgreSQL
            |
            v
     Machine Learning Layer
```

---

# Core Modules

## 1. Authentication Module

### Features

* Registration
* Login
* JWT Authentication
* User Profile Management

### APIs

```text
POST /auth/register
POST /auth/login
GET  /auth/profile
```

---

## 2. Resume Analysis Module

### Workflow

```text
Upload Resume
      |
      v
Text Extraction
      |
      v
NER Processing
      |
      v
Text Preprocessing
      |
      v
TF-IDF Vectorization
      |
      v
Role Prediction
      |
      v
Feedback Generation
```

### Features

#### Resume Upload

Supported formats:

* PDF
* DOCX

#### Resume Parsing

Extract:

* Name
* Email
* Phone
* Skills
* Education
* Certifications
* Experience

#### NER

Use:

* spaCy
* Hugging Face models

Extract entities:

```text
PERSON
SKILL
EDUCATION
EXPERIENCE
CERTIFICATION
```

---

## 3. Job Role Prediction

### Candidate Roles

Examples:

* Data Scientist
* Frontend Developer
* Backend Developer
* Full Stack Developer
* Network Engineer
* DevOps Engineer

### ML Pipeline

#### Dataset

Labeled resumes categorized by role.

#### Preprocessing

* Lowercasing
* Stopword Removal
* Tokenization
* Punctuation Removal

#### Feature Extraction

TF-IDF

#### Model

Logistic Regression

#### Metrics

* Accuracy
* Precision
* Recall
* F1 Score

### Output

```json
{
  "predicted_role": "Backend Developer",
  "confidence": 0.89
}
```

---

# Technical Assessment Module

## Workflow

```text
Question
   |
   v
User Answer
   |
   v
Similarity Evaluation
   |
   v
Score Generation
```

### Question Categories

* DSA
* DBMS
* OS
* CN
* Git
* Web Development

### Evaluation

#### Reference Answer

Stored in database.

#### Similarity Method

TF-IDF + Cosine Similarity

```text
User Answer
     vs
Reference Answer
```

### Output

```json
{
  "score": 82,
  "feedback": "Good understanding of normalization concepts."
}
```

---

# Aptitude Assessment Module

## Sections

### Quantitative

* Arithmetic
* Algebra
* Probability

### Logical

* Series
* Puzzles
* Patterns

### Verbal

* Grammar
* Reading Comprehension
* Vocabulary

---

## Data Collected

For each test:

* Score
* Accuracy
* Response Time
* Section Scores

---

## Aptitude Prediction Model

### Features

```text
overall_score
accuracy
avg_response_time
quant_score
logical_score
verbal_score
```

### Model

Random Forest Classifier

### Output Classes

* Beginner
* Intermediate
* Advanced

### Metrics

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix

---

# Recommendation Engine

Generate personalized recommendations using:

* Resume Score
* Technical Assessment Score
* Aptitude Level
* Weak Skill Areas

### Example

```text
Recommended Topics:

- Operating Systems
- SQL Joins
- Dynamic Programming
```

---

# Dashboard Module

## Features

### Resume Analytics

* Resume Score
* Predicted Role
* Missing Skills

### Technical Analytics

* Subject Scores
* Improvement Areas

### Aptitude Analytics

* Overall Score
* Section Scores

### Progress Tracking

* Historical Performance
* Trend Graphs

---

# Coding Practice Module (Future Scope)

Features:

* Online Code Editor
* Test Cases
* Auto Evaluation
* Submission History

Possible Integrations:

* Judge0
* Monaco Editor

---

# Database Design

## User

```text
id
name
email
password
role
created_at
```

## Resume

```text
id
user_id
resume_file
parsed_text
predicted_role
resume_score
created_at
```

## ExtractedEntity

```text
id
resume_id
entity_type
entity_value
```

## Assessment

```text
id
user_id
assessment_type
score
accuracy
time_taken
created_at
```

## Recommendation

```text
id
user_id
message
created_at
```

---

# Machine Learning Components

## Resume Classification

```text
TF-IDF
    +
Logistic Regression
```

Input:

* Resume Text

Output:

* Job Role

---

## Technical Answer Evaluation

```text
TF-IDF
    +
Cosine Similarity
```

Input:

* User Answer
* Reference Answer

Output:

* Similarity Score

---

## Aptitude Level Prediction

```text
Random Forest
```

Input:

* Assessment Metrics

Output:

* Beginner
* Intermediate
* Advanced

---

# Security Requirements

* JWT Authentication
* Password Hashing
* Role-Based Access Control
* File Upload Validation
* API Rate Limiting

---

# Expected Deliverables

## MVP

* User Authentication
* Resume Upload & Analysis
* Job Role Prediction
* Aptitude Test Module
* Technical Assessment Module
* Dashboard

## Advanced Version

* AI Feedback Generation
* Personalized Learning Recommendations
* Coding Practice Environment
* Analytics Dashboard
* Placement Readiness Score

---

# Suggested Development Order

Phase 1:

* Authentication
* Database Setup
* Backend APIs

Phase 2:

* Resume Upload & Parsing
* NER Pipeline

Phase 3:

* Resume Classification Model

Phase 4:

* Aptitude Assessment

Phase 5:

* Technical Assessment

Phase 6:

* Dashboard & Analytics

Phase 7:

* Recommendation Engine

Phase 8:

* Deployment & Testing

---

# Success Criteria

The system should:

1. Successfully parse and analyze resumes.
2. Predict job roles with acceptable accuracy.
3. Evaluate technical answers automatically.
4. Classify aptitude levels correctly.
5. Provide meaningful recommendations.
6. Track user performance over time.
7. Improve placement preparation through unified assessment and feedback.

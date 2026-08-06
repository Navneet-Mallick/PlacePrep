#!/usr/bin/env python
"""
Load aptitude and technical questions into Django database
"""

import os
import sys
import django
import json
from pathlib import Path

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import AptitudeQuestion, TechnicalQuestion

print("\n" + "="*60)
print("LOADING QUESTIONS INTO DATABASE")
print("="*60)

# Load Aptitude Questions
print("\n[1] Loading Aptitude Questions...")
aptitude_file = Path("ml/data/aptitude_questions.json")

if aptitude_file.exists():
    with open(aptitude_file, 'r') as f:
        data = json.load(f)
    
    for question_data in data['questions']:
        AptitudeQuestion.objects.get_or_create(
            section=question_data['section'],
            question_text=question_data['question'],
            defaults={
                'options': question_data['options'],
                'correct_option': question_data['answer'],
            }
        )
    
    count = AptitudeQuestion.objects.count()
    print(f"✓ Loaded {count} aptitude questions")
else:
    print("⚠ aptitude_questions.json not found")

# Load Technical Questions (from JSON if available)
print("\n[2] Loading Technical Questions...")

# Create sample technical questions if none exist
if TechnicalQuestion.objects.count() == 0:
    categories = ['dsa', 'dbms', 'os', 'cn', 'git', 'web']
    
    sample_questions = {
        'dsa': [
            "What is the time complexity of binary search?",
            "Explain the difference between arrays and linked lists.",
            "What is a hash table and how does collision resolution work?",
            "How do you detect a cycle in a linked list?",
            "What is the space complexity of quicksort?"
        ],
        'dbms': [
            "What is ACID in databases?",
            "Explain SQL joins - INNER, LEFT, RIGHT, FULL.",
            "What is database normalization and its forms?",
            "What is indexing and why is it important?",
            "Explain the difference between primary and foreign keys."
        ],
        'os': [
            "What is the difference between processes and threads?",
            "Explain deadlock and its conditions.",
            "What is virtual memory?",
            "Explain the purpose of an operating system.",
            "What is the difference between synchronous and asynchronous I/O?"
        ],
        'cn': [
            "Explain the TCP/IP model.",
            "What is the difference between TCP and UDP?",
            "How does DNS work?",
            "Explain the OSI model.",
            "What is IP addressing and subnetting?"
        ],
        'git': [
            "What is the difference between git clone and git fork?",
            "Explain git rebase vs git merge.",
            "What is a git cherry-pick?",
            "How do you resolve merge conflicts?",
            "What is the purpose of .gitignore?"
        ],
        'web': [
            "Explain the request-response cycle in web development.",
            "What is the difference between REST and GraphQL?",
            "Explain CORS and why it's important.",
            "What is JWT authentication?",
            "Explain the difference between HTTP and HTTPS."
        ]
    }
    
    for category, questions in sample_questions.items():
        for q in questions:
            TechnicalQuestion.objects.create(
                category=category,
                question_text=q,
                reference_answer=f"Answer to: {q}",
                difficulty='medium'
            )
    
    count = TechnicalQuestion.objects.count()
    print(f"✓ Created {count} technical questions")
else:
    count = TechnicalQuestion.objects.count()
    print(f"✓ {count} technical questions already exist")

# Verify counts
print("\n" + "="*60)
print("DATABASE STATUS")
print("="*60)
print(f"Aptitude Questions: {AptitudeQuestion.objects.count()}")
print(f"Technical Questions: {TechnicalQuestion.objects.count()}")
print("\n✓ Questions loaded successfully!")
print("✓ Refresh the app and try again!")
print("="*60 + "\n")

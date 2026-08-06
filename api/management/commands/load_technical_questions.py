"""
Load technical questions from CSV into the database
"""
from django.core.management.base import BaseCommand
from pathlib import Path
import csv
from api.models import TechnicalQuestion


class Command(BaseCommand):
    help = 'Load technical questions from CSV file'

    def handle(self, *args, **options):
        # Path to questions file
        base_dir = Path(__file__).resolve().parents[3]
        questions_file = base_dir / 'Datasets' / 'Subjective Question Dataset' / 'Software Questions (1).csv'
        
        if not questions_file.exists():
            self.stdout.write(self.style.ERROR(f'Questions file not found: {questions_file}'))
            return

        # Clear existing questions
        count_before = TechnicalQuestion.objects.count()
        self.stdout.write(f'Removing {count_before} existing questions...')
        TechnicalQuestion.objects.all().delete()
        
        # Load questions from CSV
        created_count = 0
        skipped_count = 0
        
        with open(questions_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    # Map CSV columns to model fields
                    question_text = row.get('Question', '').strip()
                    reference_answer = row.get('Answer', '').strip()
                    category_from_csv = row.get('Category', 'General Programming').strip()
                    difficulty_from_csv = row.get('Difficulty', 'Medium').strip().lower()
                    
                    if not question_text or not reference_answer:
                        skipped_count += 1
                        continue
                    
                    # Map CSV category to our model categories
                    category_mapping = {
                        # General Programming -> DSA
                        'general programming': 'dsa',
                        'general program': 'dsa',
                        
                        # Data Structures -> DSA
                        'data structures': 'dsa',
                        'algorithms': 'dsa',
                        
                        # Database -> DBMS
                        'database and sql': 'dbms',
                        'database': 'dbms',
                        
                        # Web Development -> Web
                        'web development': 'web',
                        'front-end': 'web',
                        'back-end': 'web',
                        'full-stack': 'web',
                        'languages and frameworks': 'web',
                        
                        # Version Control -> Git
                        'version control': 'git',
                        
                        # DevOps -> Git (since it's related to deployment)
                        'devops': 'git',
                        
                        # System Design -> OS
                        'system design': 'os',
                        
                        # Software Testing -> DSA (logic/algorithms)
                        'software testing': 'dsa',
                        
                        # Security -> CN (networks/security)
                        'security': 'cn',
                    }
                    
                    # Find matching category with better logic
                    category = 'dsa'  # default
                    category_lower = category_from_csv.lower()
                    
                    # Direct match
                    if category_lower in category_mapping:
                        category = category_mapping[category_lower]
                    else:
                        # Partial match
                        for key, value in category_mapping.items():
                            if key in category_lower:
                                category = value
                                break
                    
                    # Map difficulty
                    difficulty_map = {
                        'easy': 'easy',
                        'medium': 'medium',
                        'hard': 'hard'
                    }
                    difficulty = difficulty_map.get(difficulty_from_csv, 'medium')
                    
                    # Extract keywords (simple: take first 10 important words from answer)
                    words = reference_answer.lower().split()
                    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'that', 'this', 'with', 'from', 'by', 'as', 'it', 'can', 'will', 'would', 'could', 'should'}
                    keywords = [w.strip('.,;:!?()[]{}') for w in words if len(w) > 3 and w not in stop_words][:10]
                    
                    TechnicalQuestion.objects.create(
                        category=category,
                        difficulty=difficulty,
                        question_text=question_text,
                        reference_answer=reference_answer,
                        model_answer_keywords=keywords
                    )
                    created_count += 1
                    
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Error creating question: {str(e)}'))
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Successfully loaded {created_count} technical questions'
        ))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f'Skipped {skipped_count} invalid questions'))

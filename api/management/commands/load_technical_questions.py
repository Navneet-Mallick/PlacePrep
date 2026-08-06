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
        
        with open(questions_file, 'r', encoding='latin-1', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    # Map CSV columns to model fields
                    question_text = row.get('Question', '').strip()
                    reference_answer = row.get('Answer', '').strip()
                    topic = row.get('Topic', 'general').strip().lower()
                    
                    if not question_text or not reference_answer:
                        skipped_count += 1
                        continue
                    
                    # Map topic to category
                    category_mapping = {
                        'data structures': 'dsa',
                        'algorithms': 'dsa',
                        'dsa': 'dsa',
                        'database': 'dbms',
                        'dbms': 'dbms',
                        'sql': 'dbms',
                        'operating system': 'os',
                        'os': 'os',
                        'network': 'cn',
                        'networking': 'cn',
                        'computer networks': 'cn',
                        'git': 'git',
                        'version control': 'git',
                        'web': 'web',
                        'web development': 'web',
                        'html': 'web',
                        'css': 'web',
                        'javascript': 'web',
                    }
                    
                    category = category_mapping.get(topic, 'dsa')
                    
                    # Determine difficulty based on answer length (simple heuristic)
                    answer_length = len(reference_answer.split())
                    if answer_length < 30:
                        difficulty = 'easy'
                    elif answer_length < 70:
                        difficulty = 'medium'
                    else:
                        difficulty = 'hard'
                    
                    # Extract keywords (simple: take first 5 important words from answer)
                    words = reference_answer.lower().split()
                    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being'}
                    keywords = [w for w in words if len(w) > 3 and w not in stop_words][:10]
                    
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

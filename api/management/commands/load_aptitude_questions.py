"""
Load aptitude questions from JSON file into the database
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
import json
from pathlib import Path
from api.models import AptitudeQuestion


class Command(BaseCommand):
    help = 'Load aptitude questions from JSON file'

    def handle(self, *args, **options):
        # Path to questions file - updated to correct location
        base_dir = Path(__file__).resolve().parents[3]  # Goes up to project root
        questions_file = base_dir / 'ml' / 'data' / 'aptitude_questions.json'
        
        if not questions_file.exists():
            self.stdout.write(self.style.ERROR(f'Questions file not found: {questions_file}'))
            return

        # Load questions
        with open(questions_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Clear existing questions
        count_before = AptitudeQuestion.objects.count()
        AptitudeQuestion.objects.all().delete()
        
        # Create questions from JSON
        created_count = 0
        questions_list = data.get('questions', [])
        
        for q_data in questions_list:
            if isinstance(q_data, dict) and 'question' in q_data:
                try:
                    section_name = q_data.get('section', 'quantitative').lower()
                    AptitudeQuestion.objects.create(
                        section=section_name,
                        question_text=q_data.get('question', ''),
                        options=q_data.get('options', ['A', 'B', 'C', 'D']),
                        correct_option=q_data.get('answer', 'A'),
                        difficulty=q_data.get('difficulty', 'medium')
                    )
                    created_count += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Error creating question: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(
            f'Successfully loaded {created_count} aptitude questions'
        ))

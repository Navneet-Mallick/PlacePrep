"""Check technical questions in database"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import TechnicalQuestion
from django.db.models import Count

print("Technical Questions Status:")
print("="*50)

total = TechnicalQuestion.objects.count()
print(f"\nTotal questions: {total}")

if total > 0:
    print("\nQuestions by category:")
    categories = TechnicalQuestion.objects.values('category').annotate(count=Count('id'))
    for cat in categories:
        print(f"  {cat['category']}: {cat['count']} questions")
    
    print("\nQuestions by difficulty:")
    difficulties = TechnicalQuestion.objects.values('difficulty').annotate(count=Count('id'))
    for diff in difficulties:
        print(f"  {diff['difficulty']}: {diff['count']} questions")
    
    print("\nSample questions:")
    for q in TechnicalQuestion.objects.all()[:3]:
        print(f"\n  [{q.category}] {q.question_text[:60]}...")
else:
    print("\n❌ No questions found!")
    print("\nRun this command to load questions:")
    print("  python manage.py load_technical_questions")

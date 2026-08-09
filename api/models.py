from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class Resume(models.Model):
    """Store resume analysis results"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/')
    parsed_text = models.TextField(blank=True)
    predicted_role = models.CharField(max_length=255, blank=True)
    role_confidence = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(1)])
    resume_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Extracted entities (stored as JSON)
    extracted_entities = models.JSONField(default=dict, blank=True)
    
    # Recommendations from Gemini
    recommendations = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.predicted_role} ({self.resume_score}%)"


class AptitudeQuestion(models.Model):
    """Store aptitude test questions"""
    SECTION_CHOICES = [
        ('quantitative', 'Quantitative'),
        ('logical', 'Logical'),
        ('technical', 'Technical/CSE'),
    ]
    
    section = models.CharField(max_length=20, choices=SECTION_CHOICES)
    question_text = models.TextField()
    options = models.JSONField(default=list)  # List of options like ['A', 'B', 'C', 'D']
    correct_option = models.CharField(max_length=1)  # 'A', 'B', 'C', or 'D'
    difficulty = models.CharField(max_length=10, choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['section', 'id']

    def __str__(self):
        return f"{self.section.capitalize()} - Q{self.id}"


class AptitudeTestAttempt(models.Model):
    """Store aptitude test attempts and scores"""
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='aptitude_attempts')
    total_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    accuracy_percent = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_taken = models.IntegerField(help_text="Time taken in seconds")
    
    # Section-wise scores (JSON format)
    section_scores = models.JSONField(default=dict)  # {'quantitative': 85, 'logical': 90, 'technical': 75}
    
    # User answers (JSON format)
    answers = models.JSONField(default=dict)  # {question_id: selected_option, ...}
    
    # Predicted aptitude level
    aptitude_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    
    # Proctoring data
    tab_switches = models.IntegerField(default=0, help_text="Number of tab switches detected")
    proctoring_violations = models.JSONField(default=list, blank=True, help_text="List of proctoring violations")
    proctoring_score = models.IntegerField(default=100, validators=[MinValueValidator(0), MaxValueValidator(100)], help_text="Proctoring integrity score")

    # Disqualification
    is_disqualified = models.BooleanField(default=False, help_text="Attempt voided due to proctoring violations")
    disqualification_reason = models.CharField(max_length=255, blank=True, help_text="Why the attempt was disqualified")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.total_score}% - {self.aptitude_level}"


class TechnicalQuestion(models.Model):
    """Store technical assessment questions"""
    CATEGORY_CHOICES = [
        ('dsa', 'Data Structures & Algorithms'),
        ('dbms', 'Database Management Systems'),
        ('os', 'Operating Systems'),
        ('cn', 'Computer Networks'),
        ('git', 'Version Control (Git)'),
        ('web', 'Web Development'),
    ]
    
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    difficulty = models.CharField(max_length=10, choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium')
    question_text = models.TextField()
    reference_answer = models.TextField()
    model_answer_keywords = models.JSONField(default=list)  # List of keywords for evaluation
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'difficulty']

    def __str__(self):
        return f"{self.get_category_display()} - {self.question_text[:50]}"


class TechnicalAnswer(models.Model):
    """Store user's technical assessment answers"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='technical_answers')
    question = models.ForeignKey(TechnicalQuestion, on_delete=models.CASCADE)
    user_answer = models.TextField()
    score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    similarity_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(1)])
    feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'question')

    def __str__(self):
        return f"{self.user.email} - Q{self.question.id} - {self.score}%"


class Recommendation(models.Model):
    """Store personalized recommendations"""
    CATEGORY_CHOICES = [
        ('missing_skill', 'Missing Skill'),
        ('learning_path', 'Learning Path'),
        ('practice_focus', 'Practice Focus'),
        ('resume', 'Resume Improvement'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    recommendation_text = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.IntegerField(default=0, help_text="Higher number = higher priority")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.get_category_display()}"

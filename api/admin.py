from django.contrib import admin
from .models import Resume, AptitudeQuestion, AptitudeTestAttempt, TechnicalQuestion, TechnicalAnswer, Recommendation


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'predicted_role', 'resume_score', 'created_at')
    list_filter = ('created_at', 'predicted_role')
    search_fields = ('user__email', 'predicted_role', 'parsed_text')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AptitudeQuestion)
class AptitudeQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'section', 'difficulty', 'created_at')
    list_filter = ('section', 'difficulty')
    search_fields = ('question_text',)


@admin.register(AptitudeTestAttempt)
class AptitudeTestAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_score', 'aptitude_level', 'created_at')
    list_filter = ('aptitude_level', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at',)


@admin.register(TechnicalQuestion)
class TechnicalQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'difficulty', 'created_at')
    list_filter = ('category', 'difficulty')
    search_fields = ('question_text', 'reference_answer')


@admin.register(TechnicalAnswer)
class TechnicalAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'question', 'score', 'created_at')
    list_filter = ('score', 'created_at')
    search_fields = ('user__email', 'question__question_text')
    readonly_fields = ('created_at',)


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'priority', 'created_at')
    list_filter = ('category', 'priority', 'created_at')
    search_fields = ('user__email', 'recommendation_text')
    readonly_fields = ('created_at',)

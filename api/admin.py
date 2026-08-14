from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django.db.models import Avg, Count
from django.utils.html import format_html

from .models import (
    Resume, AptitudeQuestion, AptitudeTestAttempt,
    TechnicalQuestion, TechnicalAnswer, Recommendation
)


# --- Site config ---
admin.site.site_header = 'PlacementPrep Administration'
admin.site.site_title = 'PlacementPrep Admin'
admin.site.index_title = 'Platform Management'


# --- Resume ---
@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'predicted_role', 'score_bar', 'confidence_pct', 'created_at')
    list_filter = ('predicted_role', 'created_at')
    search_fields = ('user__email', 'user__username', 'predicted_role', 'parsed_text')
    readonly_fields = ('created_at', 'updated_at', 'parsed_text', 'extracted_entities', 'recommendations')
    list_per_page = 25
    date_hierarchy = 'created_at'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def score_bar(self, obj):
        color = '#10b981' if obj.resume_score >= 70 else '#f59e0b' if obj.resume_score >= 50 else '#ef4444'
        return format_html(
            '<div style="width:100px;background:#e5e7eb;border-radius:4px;overflow:hidden">'
            '<div style="width:{}%;height:8px;background:{}"></div></div> {}%',
            obj.resume_score, color, obj.resume_score
        )
    score_bar.short_description = 'Score'

    def confidence_pct(self, obj):
        return f'{obj.role_confidence * 100:.0f}%'
    confidence_pct.short_description = 'Confidence'


# --- Aptitude Questions ---
@admin.register(AptitudeQuestion)
class AptitudeQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'section', 'difficulty', 'question_preview', 'correct_option', 'created_at')
    list_filter = ('section', 'difficulty')
    search_fields = ('question_text',)
    list_per_page = 50
    list_editable = ('difficulty',)

    def question_preview(self, obj):
        return obj.question_text[:80] + '...' if len(obj.question_text) > 80 else obj.question_text
    question_preview.short_description = 'Question'


# --- Technical Questions ---
@admin.register(TechnicalQuestion)
class TechnicalQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'difficulty', 'question_preview', 'has_reference', 'created_at')
    list_filter = ('category', 'difficulty')
    search_fields = ('question_text', 'reference_answer')
    list_per_page = 50

    def question_preview(self, obj):
        return obj.question_text[:80] + '...' if len(obj.question_text) > 80 else obj.question_text
    question_preview.short_description = 'Question'

    def has_reference(self, obj):
        return bool(obj.reference_answer)
    has_reference.boolean = True
    has_reference.short_description = 'Has Ref'


# --- Technical Answers ---
@admin.register(TechnicalAnswer)
class TechnicalAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_name', 'question_preview', 'score_colored', 'similarity_score', 'created_at')
    list_filter = ('score', 'created_at')
    search_fields = ('user__email', 'question__question_text', 'user_answer')
    readonly_fields = ('created_at', 'user', 'question', 'user_answer', 'score', 'similarity_score', 'feedback')
    list_per_page = 25

    def has_add_permission(self, request):
        return False

    def user_name(self, obj):
        return obj.user.username
    user_name.short_description = 'User'

    def question_preview(self, obj):
        return obj.question.question_text[:50] + '...'
    question_preview.short_description = 'Question'

    def score_colored(self, obj):
        color = '#10b981' if obj.score >= 70 else '#f59e0b' if obj.score >= 50 else '#ef4444'
        return format_html('<span style="color:{};font-weight:bold">{}</span>', color, obj.score)
    score_colored.short_description = 'Score'


# --- Aptitude Test Attempts ---
@admin.register(AptitudeTestAttempt)
class AptitudeTestAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_score', 'aptitude_level', 'tab_switches',
                    'proctoring_score', 'is_disqualified', 'created_at')
    list_filter = ('aptitude_level', 'is_disqualified', 'created_at')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('user', 'created_at', 'answers', 'section_scores', 'proctoring_violations',
                       'total_score', 'accuracy_percent', 'time_taken', 'aptitude_level',
                       'tab_switches', 'proctoring_score', 'is_disqualified', 'disqualification_reason')
    list_per_page = 25

    def has_add_permission(self, request):
        return False

    actions = ['void_attempts']

    @admin.action(description='Disqualify selected attempts')
    def void_attempts(self, request, queryset):
        queryset.update(is_disqualified=True, disqualification_reason='Voided by admin', total_score=0)


# --- Recommendations ---
@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_name', 'category', 'priority', 'text_preview', 'created_at')
    list_filter = ('category', 'priority', 'created_at')
    search_fields = ('user__email', 'recommendation_text')
    readonly_fields = ('created_at',)
    list_per_page = 25

    def user_name(self, obj):
        return obj.user.username
    user_name.short_description = 'User'

    def text_preview(self, obj):
        return obj.recommendation_text[:60] + '...' if len(obj.recommendation_text) > 60 else obj.recommendation_text
    text_preview.short_description = 'Recommendation'

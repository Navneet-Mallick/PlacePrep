from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    login_user,
    register_user,
    get_profile,
    change_password,
    ResumeViewSet,
    AptitudeQuestionViewSet,
    AptitudeTestAttemptViewSet,
    TechnicalQuestionViewSet,
    TechnicalAnswerViewSet,
    RecommendationViewSet,
    dashboard_stats,
    health_check,
)

router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'aptitude/questions', AptitudeQuestionViewSet, basename='aptitude-question')
router.register(r'aptitude/attempts', AptitudeTestAttemptViewSet, basename='aptitude-attempt')
router.register(r'technical/questions', TechnicalQuestionViewSet, basename='technical-question')
router.register(r'technical/answers', TechnicalAnswerViewSet, basename='technical-answer')
router.register(r'recommendations', RecommendationViewSet, basename='recommendation')

urlpatterns = [
    # Health check
    path('health/', health_check, name='health'),
    
    # Authentication
    path('auth/login/', login_user, name='login'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', register_user, name='register'),
    path('auth/profile/', get_profile, name='profile'),
    path('auth/change-password/', change_password, name='change_password'),
    
    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    
    # Router URLs
    path('', include(router.urls)),
]

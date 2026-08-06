from django.conf import settings
from django.db.models import Avg, Q
from django.db import transaction
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import requests
import logging

from .models import Resume, AptitudeQuestion, AptitudeTestAttempt, TechnicalQuestion, TechnicalAnswer, Recommendation
from .services.resume_service import normalize_ml_result
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    ResumeSerializer,
    AptitudeQuestionSerializer,
    AptitudeQuestionDetailSerializer,
    AptitudeTestAttemptSerializer,
    TechnicalQuestionSerializer,
    TechnicalAnswerSerializer,
    RecommendationSerializer,
    DashboardStatsSerializer,
)

logger = logging.getLogger(__name__)


# Recommendation generation helper
def generate_recommendations(user):
    """Generate personalized recommendations based on user performance"""
    recommendations = []
    
    # Check resume
    latest_resume = Resume.objects.filter(user=user).first()
    if latest_resume and latest_resume.resume_score < 70:
        Recommendation.objects.get_or_create(
            user=user,
            category='resume',
            defaults={
                'recommendation_text': f'Your resume score is {latest_resume.resume_score}%. Focus on improving skills section and adding more projects.',
                'priority': 8
            }
        )
    
    # Check aptitude
    latest_aptitude = AptitudeTestAttempt.objects.filter(user=user).first()
    if latest_aptitude:
        for section, score in latest_aptitude.section_scores.items():
            if score < 60:
                Recommendation.objects.get_or_create(
                    user=user,
                    category='practice_focus',
                    defaults={
                        'recommendation_text': f'Practice more {section} questions. Current score: {score}%',
                        'priority': 7
                    }
                )
    
    # Check technical weak areas
    technical_answers = TechnicalAnswer.objects.filter(user=user)
    if technical_answers.exists():
        weak_categories = technical_answers.values('question__category').annotate(
            avg_score=Avg('score')
        ).filter(avg_score__lt=60)
        
        for item in weak_categories:
            category = item['question__category']
            category_name = dict(TechnicalQuestion.CATEGORY_CHOICES).get(category, category)
            Recommendation.objects.get_or_create(
                user=user,
                category='learning_path',
                defaults={
                    'recommendation_text': f'Strengthen your {category_name} fundamentals. Practice more questions.',
                    'priority': 6
                }
            )
    
    return Recommendation.objects.filter(user=user)[:10]

class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT Token endpoint with custom serializer"""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "User registered successfully", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login with email and password"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Find user by email
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Authenticate user
    user = authenticate(username=user.username, password=password)
    
    if user is None:
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get current user profile"""
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {"error": "Both old and new passwords are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {"error": "Current password is incorrect"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {"error": "New password must be at least 8 characters"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)


class ResumeViewSet(viewsets.ModelViewSet):
    """ViewSet for resume management"""
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        """Return resumes for current user only"""
        return Resume.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Upload and analyze resume"""
        if 'file' not in request.FILES:
            return Response(
                {"error": "Resume file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        
        # Validate file type
        valid_extensions = ['.pdf', '.docx']
        if not any(file.name.lower().endswith(ext) for ext in valid_extensions):
            return Response(
                {"error": "Only PDF and DOCX files are supported"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create FormData for ML API
        ml_files = {'resume': file}
        
        try:
            # Call ML API with explicit error handling
            try:
                response = requests.post(
                    f'{settings.ML_API_URL}/resume/analyze',
                    files=ml_files,
                    timeout=120,
                )
            except requests.Timeout:
                logger.error(f"ML API timeout for user {request.user.id}")
                return Response(
                    {"error": "Resume analysis timed out. Please try again."},
                    status=status.HTTP_408_REQUEST_TIMEOUT
                )
            except requests.ConnectionError as e:
                logger.error(f"ML API connection error: {str(e)}")
                return Response(
                    {"error": "Could not connect to analysis service. Ensure it is running."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            except Exception as e:
                logger.error(f"ML API request error: {str(e)}")
                return Response(
                    {"error": f"Failed to reach analysis service: {str(e)}"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Validate HTTP response status
            if response.status_code != 200:
                error_msg = response.json().get("error", "Unknown error from analysis service") if response.text else "Empty response"
                logger.error(f"ML API error (status {response.status_code}): {error_msg}")
                return Response(
                    {"error": f"Analysis service error: {error_msg}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Parse and validate ML response
            try:
                ml_response = response.json()
            except ValueError as e:
                logger.error(f"Invalid JSON from ML API: {str(e)}")
                return Response(
                    {"error": "Invalid response format from analysis service"},
                    status=status.HTTP_502_BAD_GATEWAY
                )

            # Normalize and validate the ML result
            try:
                analysis = normalize_ml_result(ml_response)
            except ValueError as e:
                logger.error(f"Validation error normalizing ML result: {str(e)}")
                return Response(
                    {"error": f"Analysis validation failed: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Reset file pointer for saving
            try:
                file.seek(0)
            except (AttributeError, OSError) as e:
                logger.error(f"File seek error: {str(e)}")
                return Response(
                    {"error": "Error processing uploaded file"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use atomic transaction to ensure consistency
            with transaction.atomic():
                resume = Resume.objects.create(
                    user=request.user,
                    file=file,
                    **analysis,
                )

            logger.info(f"Resume created successfully for user {request.user.id}: {resume.id}")
            return Response(
                ResumeSerializer(resume).data,
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            logger.exception(f"Unexpected error in resume creation for user {request.user.id}: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred while processing your resume"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest resume"""
        resume = Resume.objects.filter(user=request.user).first()
        if not resume:
            return Response({"message": "No resume found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ResumeSerializer(resume).data)


class AptitudeQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for aptitude questions"""
    queryset = AptitudeQuestion.objects.all()
    serializer_class = AptitudeQuestionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['section']

    @action(detail=False, methods=['get'])
    def by_section(self, request):
        """Get questions by section"""
        section = request.query_params.get('section')
        if not section:
            return Response(
                {"error": "Section parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        questions = AptitudeQuestion.objects.filter(section=section)
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)


class AptitudeTestAttemptViewSet(viewsets.ModelViewSet):
    """ViewSet for aptitude test attempts"""
    serializer_class = AptitudeTestAttemptSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        """Return test attempts for current user"""
        return AptitudeTestAttempt.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Submit aptitude test (complete or partial)"""
        answers = request.data.get('answers', {})
        time_taken = request.data.get('time_taken', 0)
        is_partial = request.data.get('is_partial', False)
        tab_switches = request.data.get('tab_switches', 0)
        proctoring_violations = request.data.get('proctoring_violations', [])

        if not answers:
            return Response(
                {"error": "Answers are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Score the test (both complete and partial)
            section_scores = {}
            total_correct = 0
            total_questions = 0
            total_answered = len(answers)

            for section in ['quantitative', 'logical', 'technical']:
                section_questions = AptitudeQuestion.objects.filter(section=section)
                correct = 0
                answered = 0
                total = section_questions.count()

                for question in section_questions:
                    if str(question.id) in answers:
                        answered += 1
                        total_questions += 1
                        if answers[str(question.id)] == question.correct_option:
                            correct += 1
                            total_correct += 1

                # Calculate section score based on answered questions only
                if answered > 0:
                    section_scores[section] = int((correct / answered) * 100)
                else:
                    section_scores[section] = 0

            # Calculate overall accuracy and score
            accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
            total_score = int((total_correct / total_questions * 100)) if total_questions > 0 else 0

            # Use ML API to predict aptitude level
            try:
                ml_data = {
                    'total_score': total_score,
                    'accuracy_percent': accuracy,
                    'time_taken': time_taken,
                    'quant_score': section_scores.get('quantitative', 0),
                    'logical_score': section_scores.get('logical', 0),
                    'technical_score': section_scores.get('technical', 0)
                }
                
                response = requests.post(
                    f'{settings.ML_API_URL}/aptitude/predict-level',
                    json=ml_data,
                    timeout=10,
                )
                
                if response.status_code == 200:
                    prediction = response.json()
                    aptitude_level = prediction.get('level', 'beginner')
                else:
                    # Fallback to threshold logic
                    if total_score >= 80:
                        aptitude_level = 'advanced'
                    elif total_score >= 60:
                        aptitude_level = 'intermediate'
                    else:
                        aptitude_level = 'beginner'
            except:
                # Fallback if ML API unavailable
                if total_score >= 80:
                    aptitude_level = 'advanced'
                elif total_score >= 60:
                    aptitude_level = 'intermediate'
                else:
                    aptitude_level = 'beginner'

            # Calculate proctoring score
            proctoring_score = max(0, 100 - (tab_switches * 5) - (len(proctoring_violations) * 10))

            # Create test attempt
            attempt = AptitudeTestAttempt.objects.create(
                user=request.user,
                total_score=total_score,
                accuracy_percent=accuracy,
                time_taken=time_taken,
                section_scores=section_scores,
                answers=answers,
                aptitude_level=aptitude_level,
                tab_switches=tab_switches,
                proctoring_violations=proctoring_violations,
                proctoring_score=proctoring_score
            )

            response_data = AptitudeTestAttemptSerializer(attempt).data
            response_data['is_partial'] = is_partial
            response_data['total_answered'] = total_answered
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get test attempt history"""
        attempts = self.get_queryset().order_by('-created_at')[:10]
        serializer = self.get_serializer(attempts, many=True)
        return Response(serializer.data)


class TechnicalQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for technical questions"""
    queryset = TechnicalQuestion.objects.all()
    serializer_class = TechnicalQuestionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['category', 'difficulty']

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get questions by category"""
        category = request.query_params.get('category')
        if not category:
            return Response(
                {"error": "Category parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        questions = TechnicalQuestion.objects.filter(category=category)
        serializer = self.get_serializer(questions, many=True)
        return Response(serializer.data)


class TechnicalAnswerViewSet(viewsets.ModelViewSet):
    """ViewSet for technical answers"""
    serializer_class = TechnicalAnswerSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        """Return answers for current user"""
        return TechnicalAnswer.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Submit technical answer"""
        question_id = request.data.get('question_id')
        user_answer = request.data.get('answer', '')

        if not question_id or not user_answer:
            return Response(
                {"error": "Question ID and answer are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            question = TechnicalQuestion.objects.get(id=question_id)
        except TechnicalQuestion.DoesNotExist:
            return Response(
                {"error": "Question not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Call ML API for scoring
            ml_data = {
                'user_answer': user_answer,
                'reference_answer': question.reference_answer
            }
            
            response = requests.post(
                f'{settings.ML_API_URL}/technical/evaluate',
                json=ml_data,
                timeout=60,
            )
            
            if response.status_code == 200:
                eval_result = response.json()
                score = int(eval_result.get('score', 0))
                similarity = eval_result.get('similarity', 0)
                feedback = eval_result.get('feedback', '')
            else:
                # Fallback scoring if ML API fails
                score = 0
                similarity = 0
                feedback = "Could not evaluate answer"

            # Update or create answer
            answer, created = TechnicalAnswer.objects.update_or_create(
                user=request.user,
                question=question,
                defaults={
                    'user_answer': user_answer,
                    'score': score,
                    'similarity_score': similarity,
                    'feedback': feedback
                }
            )

            return Response(
                TechnicalAnswerSerializer(answer).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get answer history"""
        answers = self.get_queryset().order_by('-created_at')[:20]
        serializer = self.get_serializer(answers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get answers by category"""
        category = request.query_params.get('category')
        if not category:
            return Response(
                {"error": "Category parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        answers = self.get_queryset().filter(question__category=category)
        serializer = self.get_serializer(answers, many=True)
        return Response(serializer.data)


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for recommendations"""
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return recommendations for current user"""
        return Recommendation.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    user = request.user
    
    # Get latest resume
    latest_resume = Resume.objects.filter(user=user).first()
    
    # Get latest aptitude attempt
    latest_aptitude = AptitudeTestAttempt.objects.filter(user=user).first()
    
    # Calculate average technical score
    technical_answers = TechnicalAnswer.objects.filter(user=user)
    avg_technical_score = technical_answers.aggregate(Avg('score'))['score__avg'] or 0
    
    # Identify weak areas
    weak_areas = []
    category_scores = technical_answers.values('question__category').annotate(
        avg_score=Avg('score')
    ).filter(avg_score__lt=70)
    
    for item in category_scores:
        category = item['question__category']
        weak_areas.append(f"{dict(TechnicalQuestion.CATEGORY_CHOICES).get(category, category)}")
    
    # Generate and get recommendations
    recommendations = generate_recommendations(user)
    
    data = {
        'resume_score': latest_resume.resume_score if latest_resume else None,
        'predicted_role': latest_resume.predicted_role if latest_resume else None,
        'aptitude_level': latest_aptitude.aptitude_level if latest_aptitude else None,
        'aptitude_score': latest_aptitude.total_score if latest_aptitude else None,
        'technical_score': float(avg_technical_score),
        'recent_resume': ResumeSerializer(latest_resume).data if latest_resume else None,
        'latest_aptitude_attempt': AptitudeTestAttemptSerializer(latest_aptitude).data if latest_aptitude else None,
        'weak_areas': weak_areas,
        'recommendations': RecommendationSerializer(recommendations, many=True).data,
        'total_tests_taken': AptitudeTestAttempt.objects.filter(user=user).count(),
        'total_technical_answers': technical_answers.count(),
    }
    
    serializer = DashboardStatsSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
def health_check(request):
    """API health check"""
    return Response({'status': 'ok', 'message': 'Django API is running'})

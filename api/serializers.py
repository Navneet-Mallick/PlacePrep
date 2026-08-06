from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Resume, AptitudeQuestion, AptitudeTestAttempt, TechnicalQuestion, TechnicalAnswer, Recommendation


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['name'] = user.first_name or user.username
        return token


class UserSerializer(serializers.ModelSerializer):
    """Serialize User model"""
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ResumeSerializer(serializers.ModelSerializer):
    """Serialize Resume model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Resume
        fields = ['id', 'user', 'file', 'parsed_text', 'predicted_role', 'role_confidence', 
                  'resume_score', 'extracted_entities', 'recommendations', 'created_at', 'updated_at']
        read_only_fields = ['user', 'parsed_text', 'predicted_role', 'role_confidence', 
                           'resume_score', 'extracted_entities', 'recommendations', 'created_at', 'updated_at']


class AptitudeQuestionSerializer(serializers.ModelSerializer):
    """Serialize AptitudeQuestion model"""
    class Meta:
        model = AptitudeQuestion
        fields = ['id', 'section', 'question_text', 'options', 'difficulty']
        # Note: correct_option should NOT be sent to frontend


class AptitudeQuestionDetailSerializer(serializers.ModelSerializer):
    """Serialize AptitudeQuestion with answer (for admin/results only)"""
    class Meta:
        model = AptitudeQuestion
        fields = ['id', 'section', 'question_text', 'options', 'correct_option', 'difficulty']


class AptitudeTestAttemptSerializer(serializers.ModelSerializer):
    """Serialize AptitudeTestAttempt model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AptitudeTestAttempt
        fields = ['id', 'user', 'total_score', 'accuracy_percent', 'time_taken', 
                  'section_scores', 'aptitude_level', 'created_at']
        read_only_fields = ['user', 'total_score', 'accuracy_percent', 'aptitude_level', 'created_at']


class TechnicalQuestionSerializer(serializers.ModelSerializer):
    """Serialize TechnicalQuestion model"""
    class Meta:
        model = TechnicalQuestion
        fields = ['id', 'category', 'difficulty', 'question_text']
        # Note: reference_answer and model_answer_keywords should NOT be sent to frontend


class TechnicalAnswerSerializer(serializers.ModelSerializer):
    """Serialize TechnicalAnswer model"""
    question = TechnicalQuestionSerializer(read_only=True)
    
    class Meta:
        model = TechnicalAnswer
        fields = ['id', 'question', 'user_answer', 'score', 'similarity_score', 'feedback', 'created_at']
        read_only_fields = ['score', 'similarity_score', 'feedback', 'created_at']


class RecommendationSerializer(serializers.ModelSerializer):
    """Serialize Recommendation model"""
    class Meta:
        model = Recommendation
        fields = ['id', 'recommendation_text', 'category', 'priority', 'created_at']
        read_only_fields = ['created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Serialize dashboard statistics"""
    resume_score = serializers.IntegerField(allow_null=True)
    predicted_role = serializers.CharField(allow_null=True)
    aptitude_level = serializers.CharField(allow_null=True)
    technical_score = serializers.FloatField(allow_null=True)
    recent_resume = ResumeSerializer(allow_null=True)
    latest_aptitude_attempt = AptitudeTestAttemptSerializer(allow_null=True)
    weak_areas = serializers.ListField(child=serializers.CharField())
    recommendations = RecommendationSerializer(many=True)

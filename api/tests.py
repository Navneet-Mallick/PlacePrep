from io import BytesIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Resume


class AuthAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.profile_url = reverse('profile')
        self.refresh_url = reverse('token_refresh')

    def test_register_user(self):
        payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Test',
            'password': 'securepass123',
            'password_confirm': 'securepass123',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_password_mismatch(self):
        payload = {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'securepass123',
            'password_confirm': 'differentpass',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens(self):
        User.objects.create_user(
            username='loginuser',
            email='login@example.com',
            password='securepass123',
        )
        response = self.client.post(
            self.login_url,
            {'email': 'login@example.com', 'password': 'securepass123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'login@example.com')

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authenticated(self):
        user = User.objects.create_user(
            username='profileuser',
            email='profile@example.com',
            password='securepass123',
            first_name='Profile',
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'profile@example.com')

    def test_token_refresh(self):
        user = User.objects.create_user(
            username='refreshuser',
            email='refresh@example.com',
            password='securepass123',
        )
        login_response = self.client.post(
            self.login_url,
            {'email': 'refresh@example.com', 'password': 'securepass123'},
            format='json',
        )
        refresh = login_response.data['refresh']
        response = self.client.post(self.refresh_url, {'refresh': refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class ResumeAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='resumeuser',
            email='resume@example.com',
            password='securepass123',
        )
        self.client.force_authenticate(user=self.user)
        self.upload_url = reverse('resume-list')

    @patch('api.views.requests.post')
    def test_resume_upload_persists_analysis(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'parsed_text': 'John Doe Python Developer',
            'resume_score': 82,
            'predicted_role': 'Backend Developer',
            'confidence': 0.91,
            'entities': {'skills': ['python', 'django']},
            'recommendations': {'summary': 'Strong backend profile'},
        }

        file_content = b'%PDF-1.4 sample resume content'
        upload = SimpleUploadedFile('resume.pdf', file_content, content_type='application/pdf')
        response = self.client.post(self.upload_url, {'file': upload}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['resume_score'], 82)
        self.assertEqual(response.data['predicted_role'], 'Backend Developer')

        resume = Resume.objects.get(user=self.user)
        self.assertEqual(resume.resume_score, 82)
        self.assertEqual(resume.parsed_text, 'John Doe Python Developer')

    def test_resume_upload_requires_authentication(self):
        self.client.force_authenticate(user=None)
        upload = SimpleUploadedFile('resume.pdf', b'content', content_type='application/pdf')
        response = self.client.post(self.upload_url, {'file': upload}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_resume_upload_rejects_invalid_type(self):
        upload = SimpleUploadedFile('resume.txt', b'plain text', content_type='text/plain')
        response = self.client.post(self.upload_url, {'file': upload}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DashboardAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='dashuser',
            email='dash@example.com',
            password='securepass123',
        )
        self.client.force_authenticate(user=self.user)
        self.stats_url = reverse('dashboard_stats')

    def test_dashboard_stats_with_resume(self):
        Resume.objects.create(
            user=self.user,
            file=SimpleUploadedFile('resume.pdf', b'pdf', content_type='application/pdf'),
            parsed_text='Sample resume',
            predicted_role='Data Scientist',
            role_confidence=0.88,
            resume_score=75,
            extracted_entities={'skills': ['python']},
            recommendations={},
        )
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resume_score'], 75)
        self.assertEqual(response.data['predicted_role'], 'Data Scientist')

    def test_dashboard_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

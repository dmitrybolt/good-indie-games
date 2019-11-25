from django.test import TestCase
from django.contrib.auth import get_user_model

from core import models


# def sample_user(email='test@test.com', password='testpass'):
#     """Create a sample user"""
#     return get_user_model().objects.create_user(email, password)


class ModelTests(TestCase):

    def test_create_user_with_email_successful(self):
        """Test creating a new user with an email is successful"""
        email = 'test@test.com'
        password = 'Testpass123'
        user = get_user_model().objects.create_user(
            email=email,
            password=password
        )
        self.assertEqual(user.email, email)
        self.assertTrue(user.check_password(password))

    def test_new_user_email_normalized(self):
        """Test the email for a new user is normalized"""
        email = 'test@TEST.COM'
        user = get_user_model().objects.create_user(email, 'test123')

        self.assertEqual(user.email, email.lower())

    def test_new_user_invalid_email(self):
        """Test creating user with no email raises error"""
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(None, 'test123')

    def test_create_new_superuser(self):
        """Test creating a new superuser"""
        user = get_user_model().objects.create_superuser(
            'test@test.com',
            'test123'
        )
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)

    def test_genre_str(self):
        """Test the genre string representation"""
        genre = models.Genre.objects.create(name='Adventure')

        self.assertEqual(str(genre), genre.name)

    def test_platform_str(self):
        """Test the platform string representation"""
        platform = models.Platform.objects.create(name='Android')

        self.assertEqual(str(platform), platform.name)

    def test_developer_str(self):
        """Test the developer string representation"""
        developer = models.Developer.objects.create(name='Playdead')

        self.assertEqual(str(developer), developer.name)

    def test_publisher_str(self):
        """Test the publisher string representation"""
        publisher = models.Publisher.objects.create(name='Devolver Digital')

        self.assertEqual(str(publisher), publisher.name)
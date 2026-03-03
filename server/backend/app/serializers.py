# app/serializers.py
from allauth.account import app_settings as allauth_settings
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Business, Profile

User = get_user_model()

class CustomRegisterSerializer(RegisterSerializer):
    email = serializers.EmailField(required=allauth_settings.SIGNUP_FIELDS['email']['required'])
    username = serializers.CharField(required=allauth_settings.SIGNUP_FIELDS['username']['required'])
    role = serializers.ChoiceField(choices=(("user", "User"), ("business", "Business")), default="user")

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['email'] = self.validated_data.get('email', '')
        data['username'] = data['email']
        data["role"] = self.validated_data.get("role", "user")
        return data

    def save(self, request):
        print("CustomRegisterSerializer.save called; role:", self.initial_data.get("role"))
        user = super().save(request)
        role = self.validated_data.get("role", self.initial_data.get("role", "user"))
        Profile.objects.update_or_create(user=user, defaults={"role": role})
        return user

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class UserDetailsSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role")

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return "user"
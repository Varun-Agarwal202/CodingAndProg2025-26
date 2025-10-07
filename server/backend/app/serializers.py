# app/serializers.py
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from allauth.account import app_settings as allauth_settings
from .models import Business

class CustomRegisterSerializer(RegisterSerializer):
    email = serializers.EmailField(required=allauth_settings.SIGNUP_FIELDS['email']['required'])
    username = serializers.CharField(required=allauth_settings.SIGNUP_FIELDS['username']['required'])

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['email'] = self.validated_data.get('email', '')
        data['username'] = data['email']
        return data

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
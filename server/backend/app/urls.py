from django.contrib import admin
from django.urls import path, include
from .views import fetch_businesses

urlpatterns = [
    path('nearby_businesses/', fetch_businesses, name='fetch_businesses'),
]
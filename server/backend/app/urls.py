from django.contrib import admin
from django.urls import path, include
from .views import fetch_businesses, getBusiness, add_bookmark

urlpatterns = [
    path('nearby_businesses/', fetch_businesses, name='fetch_businesses'),
    path('getBusiness/', getBusiness, name='fetch_businesses'),
    path('add_bookmark/', add_bookmark, name='add_bookmark'),
]
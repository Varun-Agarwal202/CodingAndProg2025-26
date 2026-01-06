from django.contrib import admin
from django.urls import path, include
from .views import fetch_businesses, getBusiness, add_bookmark, user_bookmarks, get_businesses

urlpatterns = [
    path('nearby_businesses/', fetch_businesses, name='fetch_businesses'),
    path('getBusiness/', getBusiness, name='fetch_businesses'),
    path('add_bookmark/', add_bookmark, name='add_bookmark'),
    path('businesses/', get_businesses, name='get_businesses'),
    path('user_bookmarks/', user_bookmarks, name='user_bookmarks'),
]
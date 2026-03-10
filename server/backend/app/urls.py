from django.contrib import admin
from django.urls import path, include
from .views import (
    fetch_businesses,
    getBusiness,
    add_bookmark,
    user_bookmarks,
    get_businesses,
    my_profile,
    geocode,
    add_review,
    generate_report,
)

urlpatterns = [
    path('nearby_businesses/', fetch_businesses, name='fetch_businesses'),
    path('geocode/', geocode, name='geocode'),
    path('getBusiness/', getBusiness, name='fetch_businesses'),
    path('add_bookmark/', add_bookmark, name='add_bookmark'),
    path('businesses/', get_businesses, name='get_businesses'),
    path('user_bookmarks/', user_bookmarks, name='user_bookmarks'),
    path('my_profile/', my_profile, name='my_profile'),
    path('add_review/', add_review, name='add_review'),
    path('generate_report/', generate_report, name='generate_report'),
]
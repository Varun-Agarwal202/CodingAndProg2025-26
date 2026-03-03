from django.contrib import admin
from .models import Business, Profile

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name','place_id','created_at')

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user','role')
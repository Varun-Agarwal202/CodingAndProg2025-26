from django.contrib import admin

# Register your models here.

from .models import Business, Profile
admin.site.register(Business)
admin.site.register(Profile)   
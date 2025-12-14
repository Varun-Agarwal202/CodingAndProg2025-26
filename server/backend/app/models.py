from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
# Create your models here.

class Business(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    reviews = models.JSONField(default=list, blank=True)  # List of reviews
    place_id = models.CharField(max_length=255, unique=True)
    types = models.JSONField(default=list, blank=True)  # List of types/categories
    rating = models.FloatField(null=True, blank=True)
    user_ratings_total = models.IntegerField(null=True, blank=True)
    price_level = models.IntegerField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    opening_hours = models.JSONField(default=dict, blank=True)  # Dictionary of opening hours
    photos = models.JSONField(default=list, blank=True)  # List of photo URLs
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    special_offers = models.TextField(null=True, blank=True)
    def __str__(self):
        return self.name
    def return_dict(self):
        return {
            "name": self.name,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "reviews": self.reviews,
            "place_id": self.place_id,
            "types": self.types,
            "rating": self.rating,
            "user_ratings_total": self.user_ratings_total,
            "price_level": self.price_level,
            "website": self.website,
            "contact_number": self.contact_number,
            "opening_hours": self.opening_hours,
            "photos": self.photos,
            "special_offers": self.special_offers,
        }
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    bookmarked_businesses = models.ManyToManyField(Business, blank=True, related_name='bookmarked_by')

    def __str__(self):
        return f"Profile: {self.user}"

# create profile automatically when a user is created
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    # ensures profile exists and is saved after user updates
    instance.profile.save()
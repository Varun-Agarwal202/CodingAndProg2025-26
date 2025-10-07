from django.db import models

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
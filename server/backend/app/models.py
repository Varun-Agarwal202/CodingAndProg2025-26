from django.db import models
from django.conf import settings
import hashlib
import random

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
    # When True, this business can appear in the Community Spotlight component.
    # spotlight_added_at is used so we can evict the oldest spotlight entry when
    # the list is full.
    is_spotlight = models.BooleanField(default=False)
    spotlight_added_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

    def get_deals(self):
        """
        Return a deterministic, pseudo-random subset of generic deals for this business.
        Uses the place_id (or pk) to seed the random generator so deals are stable.
        """
        deals_bank = [
            "10% off your first visit",
            "Buy one, get one 50% off on select items",
            "Free drink with any entrée purchase",
            "Free dessert with two entrées",
            "Kids eat free on Tuesdays",
            "Happy hour: 20% off from 3–5pm",
            "Free appetizer with main course",
            "Loyalty card: buy 9, get 10th free",
            "Student discount: 15% off with ID",
            "Senior discount: 10% off every Wednesday",
            "Free gift with purchases over $50",
            "Weekend special: 2-for-1 on select items",
            "Early bird special: 15% off before 11am",
            "Family bundle deal – save 25%",
            "Free upgrade to large size",
            "No delivery fee on orders over $25",
            "Online-only discount: 10% off",
            "Refer a friend & both get $5 off",
            "Seasonal sale: up to 30% off",
            "New customer coupon: $10 off",
            "Free sample pack with purchase",
            "Birthday reward: free item of your choice",
            "Bundle any 3 items & save 20%",
            "Flash sale: 15% off today only",
            "Free consultation for new clients",
            "Membership deal: extra 5% off",
            "Buy 2 services, get 3rd half off",
            "Complimentary upgrade on first booking",
            "Free trial week for new members",
            "Holiday special: bonus gift card",
            "Limited-time combo deal",
            "Neighborhood discount: 10% off",
            "Book online & save 5%",
            "Weekend events: free entry with purchase",
            "Flat $5 off all orders over $20",
            "Reward points: double points this month",
            "Free eco-friendly tote with purchase",
            "Team discount for groups of 4+",
            "Lunch special: drink included",
            "Morning coffee combo deal",
            "After-school snack special",
            "Midweek special: 2-for-1 tickets",
            "Free add-on with any service",
            "Family night: free kids activity",
            "Local business partner discount",
            "Buy a gift card, get bonus credit",
            "Monthly subscription discount",
            "Free refill on select beverages",
            "Complimentary tasting event invite",
            "Limited edition bundle pricing",
        ]

        if self.place_id:
            seed_source = self.place_id
        elif self.pk:
            seed_source = str(self.pk)
        else:
            seed_source = "business"

        seed_int = int(hashlib.sha256(seed_source.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(seed_int)
        count = rng.randint(1, min(8, len(deals_bank)))
        return rng.sample(deals_bank, k=count)

    def return_dict(self):
        deals = self.get_deals()
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
            "deals": deals,
            "is_spotlight": self.is_spotlight,
        }
class Profile(models.Model):
    ROLE_USER = 'user'
    ROLE_BUSINESS = 'business'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_BUSINESS, 'Business'),
        (ROLE_ADMIN, 'Admin'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    bookmarked_businesses = models.ManyToManyField(Business, blank=True, related_name='bookmarked_by')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)

    def __str__(self):
        return f"Profile: {self.user} ({self.role})"

    def is_business(self):
        return self.role == self.ROLE_BUSINESS
    
    def is_admin(self):
        return self.role == self.ROLE_ADMIN
    
    def to_dict(self):
        return {
            "user_id": self.user.id,
            "username": getattr(self.user, "username", None),
            "role": self.role,
        }
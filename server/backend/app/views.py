from django.shortcuts import render
from django.http import JsonResponse
from .models import Business
from .serializers import BusinessSerializer
import requests
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@api_view(['GET', 'POST'])
def fetch_businesses(request):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    data = request.data
    lat = data.get('lat')
    lng = data.get('lng')
    radius = data.get('radius', 5000)
    keyword = data.get('type', '')  # e.g., "gym" or "restaurant"
    api_key = "AIzaSyCq8572ZvPfCWw9uEi0tEw6M2m75H5F1kU"

    # --- Build parameters for Google Places API ---
    params = {
        'location': f'{lat},{lng}',
        'radius': radius,
        'key': api_key,
    }
    if keyword:
        params['keyword'] = keyword

    # --- Call Nearby Search API ---
    response = requests.get(url, params=params)
    api_data = response.json()
    results = api_data.get('results', [])

    print("API Status:", api_data.get("status"))
    print("Number of results:", len(results))

    # --- Save each result to the database (but not used for return) ---
    for place in results:
        place_id = place.get('place_id')
        business, created = Business.objects.get_or_create(
            place_id=place_id,
            defaults={
                'latitude': place['geometry']['location']['lat'],
                'longitude': place['geometry']['location']['lng'],
            }
        )

        # Only update if new
        if created:
            details = get_business_details(place_id, api_key)
            business.name = details.get('name', '')
            business.address = details.get('formatted_address', '')
            business.rating = details.get('rating')
            business.user_ratings_total = details.get('user_ratings_total')
            business.price_level = details.get('price_level')
            business.website = details.get('website')
            business.contact_number = details.get('formatted_phone_number')
            business.opening_hours = details.get('opening_hours', {})
            business.photos = [
                f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={api_key}"
                for photo in details.get('photos', [])
            ]
            business.reviews = details.get('reviews', [])
            business.types = details.get('types', [])
            business.save()

    # --- Return the fresh API results directly ---
    return JsonResponse(results, safe=False)



def get_business_details(place_id, api_key):
    details_url = "https://maps.googleapis.com/maps/api/place/details/json"
    details_params = {
        'place_id': place_id,
        'fields': 'name,rating,formatted_phone_number,formatted_address,opening_hours,website,photos,reviews,price_level,user_ratings_total,types',
        'key': api_key
    }
    details_response = requests.get(details_url, params=details_params)
    return details_response.json().get('result', {})
@csrf_exempt
@api_view(['GET', 'POST'])
def getBusiness(request):
    print("GET Business called")
    data = request.data
    place_id = data.get('place_id')
    try:
        business = Business.objects.get(place_id=place_id)
        return JsonResponse(business.return_dict(), safe=False)
    except Business.DoesNotExist:
        return JsonResponse({'error': 'Business not found'}, status=404)
@csrf_exempt
@api_view(['POST'])
def add_bookmark(request):
    print("Add Bookmark called")
    place_id = request.data
    place_id = place_id.get('business')
    print("Place ID:", place_id)
    user = request.user
    print("User:", user)
    try:
        business = Business.objects.get(place_id=place_id)
        print(business)
        user.profile.bookmarked_businesses.add(business)
        print(user.profile.bookmarked_businesses.all())
        return JsonResponse({'success': 'Business bookmarked'}, status=200)
    except Business.DoesNotExist:
        print("Business not found")
        return JsonResponse({'error': 'Business not found'}, status=404)
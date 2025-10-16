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
    keyword = data.get('type')  # Whatever the user sends, like "shopping mall"
    print("Keyword received:", keyword)

    api_key = "AIzaSyCq8572ZvPfCWw9uEi0tEw6M2m75H5F1kU"
    if keyword == "":  # Replace with your actual API key
        params = {
            'location': f'{lat},{lng}',
            'radius': 10000,        # 5 km radius
            'key': api_key
        }
    else:
        params = {
            'location': f'{lat},{lng}',
            'radius': 10000,        # 5 km radius
            'types': keyword,       # Use type for specific categories
            'key': api_key
        }

    response = requests.get(url, params=params)
    data = response.json()
    print("API Status:", data.get("status"))
    print("Number of results:", len(data.get('results', [])))
    for place in data.get('results', []):
        place_id = place['place_id']
        print(place['name'], place_id)
        business, created = Business.objects.get_or_create(
            place_id=place_id,
            defaults={
                'latitude': place['geometry']['location']['lat'],
                'longitude': place['geometry']['location']['lng'],
            }
        )
        if created:
            details = get_business_details(place_id, api_key)
            business.name = details.get('name', '')
            print("Saving business:", business.name)
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
    if keyword == "":
        print("Hello!")
        businesses = Business.objects.all()
    else:
        businesses = Business.objects.filter(types__icontains=keyword)
    serializer = BusinessSerializer(businesses, many=True)
    return JsonResponse(serializer.data, safe=False)


def get_business_details(place_id, api_key):
    details_url = "https://maps.googleapis.com/maps/api/place/details/json"
    details_params = {
        'place_id': place_id,
        'fields': 'name,rating,formatted_phone_number,formatted_address,opening_hours,website,photos,reviews,price_level,user_ratings_total,types',
        'key': api_key
    }
    details_response = requests.get(details_url, params=details_params)
    return details_response.json().get('result', {})

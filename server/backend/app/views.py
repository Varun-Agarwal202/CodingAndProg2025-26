from django.shortcuts import render
from django.http import JsonResponse
from .models import Business
from .serializers import BusinessSerializer
import requests
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes, permission_classes
from django.db.models import Q
from django.db import connection


@csrf_exempt
@api_view(['GET', 'POST'])
def fetch_businesses(request):
    url_nearby = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    url_text = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    data = request.data
    lat = data.get('lat')
    lng = data.get('lng')
    radius = data.get('radius', 5) * 1000
    keyword = data.get('type', '')    # kept for compatibility
    query = data.get('query')    # new: text search string
    api_key = "AIzaSyCoxkur1IMrFgWYnTrdWANhisU2VBM9HaQ"

    # choose text search if a query was supplied, otherwise nearby search
    if query:
        query = "local " + query
    else:
        query = "local"

    print("query:", query)
    params = {'query': query, 'key': api_key}
    # bias results by location if available
    if lat and lng:
        params.update({'location': f'{lat},{lng}', 'radius': radius})
    if keyword:
        params['type'] = keyword
    response = requests.get(url_text, params=params)


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
            # Use Places Photos (New) when the photo resource name is provided,
            # fallback to legacy photo_reference when available.
            photos = []
            for photo in details.get('photos', []):
                # new API returns a 'name' like: "places/PLACE_ID/photos/PHOTO_RESOURCE"
                print(photo)
                if photo.get('name'):
                    photos.append(f"https://places.googleapis.com/v1/{photo['name']}/media?maxWidthPx=400&key={api_key}")
                elif photo.get('photo_reference'):
                    photos.append(f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={api_key}")
            business.photos = photos
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
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def user_bookmarks(request):
    profile = request.user.profile
    print(profile)
    place_ids = list(profile.bookmarked_businesses.values_list('place_id', flat=True))
    return JsonResponse({'bookmarks': place_ids})

@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def add_bookmark(request):
    place_id = request.data.get('business')
    profile = request.user.profile
    try:
        business = Business.objects.get(place_id=place_id)
    except Business.DoesNotExist:
        return JsonResponse({'error': 'Business not found'}, status=404)
    # toggle or add depending on your API design
    if business in profile.bookmarked_businesses.all():
        profile.bookmarked_businesses.remove(business)
        action = 'removed'
    else:
        profile.bookmarked_businesses.add(business)
        action = 'added'
    return JsonResponse({'success': action, 'bookmarks': list(profile.bookmarked_businesses.values_list('place_id', flat=True))})
@csrf_exempt
@api_view(['GET'])
def get_businesses(request):
    q = request.GET.get('q', '').strip()
    type_filter = request.GET.get('type', '').strip()

    queryset = Business.objects.all()

    if q:
        queryset = queryset.filter(
            Q(name__icontains=q) |
            Q(address__icontains=q) |
            Q(place_id__icontains=q)
        )

    if type_filter:
        # Only use JSON contains on PostgreSQL (SQLite doesn't support it).
        if connection.vendor == 'postgresql':
            queryset = queryset.filter(types__contains=[type_filter])
        else:
            # fallback: do a case-insensitive substring match on the stored value
            # (works for plain text or JSON serialized as text)
            queryset = queryset.filter(types__icontains=type_filter)

    results = [b.return_dict() for b in queryset]
    return JsonResponse(results, safe=False)
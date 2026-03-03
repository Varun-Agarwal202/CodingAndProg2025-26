from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
import requests
from django.db.models import Q
from django.db import connection
from django.http import JsonResponse
from .models import Business, Profile

REQUEST_TIMEOUT = 8  # seconds

@csrf_exempt
@api_view(['GET', 'POST'])
def fetch_businesses(request):
    """
    POST endpoint used by frontend to perform either a Places Text Search (when 'query'
    is provided) or a Nearby Search (when only lat/lng are provided). Results are also
    persisted into Business table when new.
    """
    url_nearby = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    url_text = "https://maps.googleapis.com/maps/api/place/textsearch/json"

    data = request.data if request.method == 'POST' else request.GET
    lat = data.get('lat')
    lng = data.get('lng')
    radius_km = float(data.get('radius', 5))
    try:
        radius = int(radius_km * 1000)
    except Exception:
        radius = 5000
    keyword = data.get('type', '')    # kept for compatibility
    query = (data.get('query') or '').strip()
    api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
    if not api_key:
        return JsonResponse({'error': 'API key not configured'}, status=500)

    # Build params and choose endpoint
    try:
        if query:
            # text search
            params = {'query': f'local businesses {query}', 'key': api_key}
            if lat and lng:
                params.update({'location': f'{lat},{lng}'})
            if keyword:
                params['type'] = keyword
            response = requests.get(url_text, params=params, timeout=REQUEST_TIMEOUT)
        else:
            # nearby search (radius required)
            params = {'key': api_key}
            if lat and lng:
                params.update({'location': f'{lat},{lng}', 'radius': radius})
            if keyword:
                params['type'] = keyword
            else:
                # add a generic keyword to bias results toward businesses
                params.setdefault('keyword', 'local business')
            response = requests.get(url_nearby, params=params, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as e:
        return JsonResponse({'error': 'External API request failed', 'details': str(e)}, status=502)

    if response.status_code != 200:
        return JsonResponse({'error': 'Places API returned error', 'status_code': response.status_code}, status=502)

    api_data = response.json()
    results = api_data.get('results', [])

    # Save each result to the database (only create/update when needed)
    for place in results:
        place_id = place.get('place_id')
        if not place_id:
            continue
        business, created = Business.objects.get_or_create(
            place_id=place_id,
            defaults={
                'latitude': place['geometry']['location']['lat'],
                'longitude': place['geometry']['location']['lng'],
            }
        )

        # Only populate details when newly created (avoid repeated detail calls)
        if created:
            details = get_business_details(place_id, api_key)
            business.name = details.get('name', place.get('name', ''))
            business.address = details.get('formatted_address', place.get('vicinity', ''))
            business.rating = details.get('rating') or place.get('rating')
            business.user_ratings_total = details.get('user_ratings_total') or place.get('user_ratings_total')
            business.price_level = details.get('price_level') or place.get('price_level')
            business.website = details.get('website')
            business.contact_number = details.get('formatted_phone_number')
            business.opening_hours = details.get('opening_hours', {})
            photos = []
            for photo in details.get('photos', []):
                if photo.get('name'):
                    photos.append(f"https://places.googleapis.com/v1/{photo['name']}/media?maxWidthPx=400&key={api_key}")
                elif photo.get('photo_reference'):
                    photos.append(f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo['photo_reference']}&key={api_key}")
            business.photos = photos
            business.reviews = details.get('reviews', [])
            business.types = details.get('types', []) or place.get('types', [])
            business.save()

    return JsonResponse(results, safe=False)


def get_business_details(place_id, api_key):
    details_url = "https://maps.googleapis.com/maps/api/place/details/json"
    details_params = {
        'place_id': place_id,
        'fields': 'name,rating,formatted_phone_number,formatted_address,opening_hours,website,photos,reviews,price_level,user_ratings_total,types',
        'key': api_key
    }
    try:
        details_response = requests.get(details_url, params=details_params, timeout=REQUEST_TIMEOUT)
        if details_response.status_code != 200:
            return {}
        return details_response.json().get('result', {}) or {}
    except requests.RequestException:
        return {}


@csrf_exempt
@api_view(['GET', 'POST'])
def getBusiness(request):
    """
    Accepts POST with JSON { place_id } or GET with ?place_id=...
    """
    data = request.data if request.method == 'POST' else request.GET
    place_id = data.get('place_id')
    if not place_id:
        return JsonResponse({'error': 'place_id required'}, status=400)
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
        if connection.vendor == 'postgresql':
            queryset = queryset.filter(types__contains=[type_filter])
        else:
            queryset = queryset.filter(types__icontains=type_filter)

    results = [b.return_dict() for b in queryset]
    return JsonResponse(results, safe=False)


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def my_profile(request):
    """
    GET: return { user, role }
    POST: optional -> update role (for testing / signup flow). In production restrict to admin.
    """
    profile = getattr(request.user, 'profile', None)
    if profile is None:
        profile = Profile.objects.create(user=request.user)

    if request.method == 'GET':
        return JsonResponse({'user': request.user.username, 'role': profile.role})

    # POST to change role (CAUTION: restrict in real app)
    new_role = request.data.get('role')
    if new_role and new_role in dict(Profile.ROLE_CHOICES).keys():
        # example restriction: only allow user to set 'business' immediately, or require admin
        profile.role = new_role
        profile.save()
        return JsonResponse({'success': True, 'role': profile.role})
    return JsonResponse({'error': 'invalid role'}, status=400)
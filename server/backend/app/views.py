import logging
from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from dj_rest_auth.views import LoginView
import requests
from django.db.models import Q
from django.db import connection
from django.http import JsonResponse
from .models import Business, Profile

REQUEST_TIMEOUT = 8  # seconds


class CaptchaLoginView(LoginView):
    """
    Login view that enforces Google reCAPTCHA verification before authenticating.
    """

    def post(self, request, *args, **kwargs):
        token = request.data.get("recaptcha_token")
        if not token:
            return Response(
                {"detail": "reCAPTCHA verification is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        secret = getattr(settings, "RECAPTCHA_SECRET_KEY", "")
        if not secret:
            return Response(
                {"detail": "reCAPTCHA secret key is not configured on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            verify_res = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": secret, "response": token},
                timeout=REQUEST_TIMEOUT,
            )
        except requests.RequestException:
            return Response(
                {"detail": "reCAPTCHA verification failed. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payload = verify_res.json() or {}
        success = payload.get("success")
        score = payload.get("score")
        action = payload.get("action")

        # For reCAPTCHA v3 you can additionally enforce score/action checks here.
        if not success:
            return Response(
                {"detail": "reCAPTCHA validation failed. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().post(request, *args, **kwargs)

@csrf_exempt
@api_view(['POST'])
def geocode(request):
    """
    POST { address: string } -> { success, latitude, longitude, formatted_address }
    Uses Google Geocoding API with GOOGLE_PLACES_API_KEY.
    """
    data = request.data or {}
    address = (data.get('address') or '').strip()
    if not address:
        return JsonResponse({'success': False, 'error': 'address required'}, status=400)

    api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)
    if not api_key:
        return JsonResponse({'success': False, 'error': 'API key not configured'}, status=500)

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {'address': address, 'key': api_key}
    try:
        res = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as e:
        return JsonResponse({'success': False, 'error': 'External API request failed', 'details': str(e)}, status=502)

    if res.status_code != 200:
        return JsonResponse({'success': False, 'error': 'Geocoding API returned error', 'status_code': res.status_code}, status=502)

    payload = res.json() or {}
    status = payload.get('status')
    results = payload.get('results') or []
    if status != 'OK' or not results:
        return JsonResponse({'success': False, 'error': 'Could not find location', 'status': status}, status=200)

    top = results[0]
    loc = ((top.get('geometry') or {}).get('location') or {})
    lat = loc.get('lat')
    lng = loc.get('lng')
    formatted = top.get('formatted_address') or address

    if lat is None or lng is None:
        return JsonResponse({'success': False, 'error': 'Could not parse location', 'status': status}, status=200)

    return JsonResponse({
        'success': True,
        'latitude': lat,
        'longitude': lng,
        'formatted_address': formatted,
    })

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


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """
    Generate a customizable data report over businesses.
    Payload can include:
      - mode: "directory" (default) or "business"
      - place_id: optional, to scope to a single business
      - type: optional Google Places type/category filter
      - min_rating: optional minimum rating filter
      - bookmarks_only: if true, restricts to user's bookmarked businesses
      - limit: max number of businesses to include in lists (default 25)
      - sort_by: "rating" (default) or "reviews"
    """
    data = request.data or {}
    mode = (data.get('mode') or 'directory').lower()
    place_id = data.get('place_id') or ''
    type_filter = (data.get('type') or '').strip()
    sort_by = (data.get('sort_by') or 'rating').lower()
    bookmarks_only = bool(data.get('bookmarks_only'))
    try:
        min_rating = float(data.get('min_rating')) if data.get('min_rating') not in (None, '') else None
    except (TypeError, ValueError):
        min_rating = None

    try:
        limit = int(data.get('limit') or 25)
    except (TypeError, ValueError):
        limit = 25
    limit = max(1, min(limit, 200))

    qs = Business.objects.all()

    if mode == 'business' and place_id:
        qs = qs.filter(place_id=place_id)

    if type_filter:
        if connection.vendor == 'postgresql':
            qs = qs.filter(types__contains=[type_filter])
        else:
            qs = qs.filter(types__icontains=type_filter)

    if min_rating is not None:
        qs = qs.filter(rating__gte=min_rating)

    # Restrict to user's bookmarks if requested
    if bookmarks_only:
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            return JsonResponse({'error': 'Profile not found for user.'}, status=400)
        qs = qs.filter(bookmarked_by__in=[profile]).distinct()

    total_businesses = qs.count()
    if total_businesses == 0:
        return JsonResponse({
            'total_businesses': 0,
            'average_rating': None,
            'average_review_count': None,
            'type_filter': type_filter,
            'min_rating': min_rating,
            'bookmarks_only': bookmarks_only,
            'businesses': [],
            'top_businesses': [],
        })

    # Aggregate stats
    ratings = list(qs.values_list('rating', flat=True))
    review_counts = list(qs.values_list('user_ratings_total', flat=True))
    ratings_clean = [r for r in ratings if r is not None]
    review_counts_clean = [c for c in review_counts if c is not None]

    avg_rating = sum(ratings_clean) / len(ratings_clean) if ratings_clean else None
    avg_reviews = sum(review_counts_clean) / len(review_counts_clean) if review_counts_clean else None

    # Sort for "top businesses"
    if sort_by == 'reviews':
        ordered_queryset = qs.order_by('-user_ratings_total', '-rating')
        ordered = list(ordered_queryset[:limit])
    elif sort_by == 'deals':
        # Sort in Python by number of deals derived from Business.get_deals()
        ordered = sorted(qs, key=lambda b: len(b.get_deals()), reverse=True)[:limit]
    else:
        ordered_queryset = qs.order_by('-rating', '-user_ratings_total')
        ordered = list(ordered_queryset[:limit])

    top_businesses = [b.return_dict() for b in ordered]

    return JsonResponse({
        'total_businesses': total_businesses,
        'average_rating': round(avg_rating, 2) if avg_rating is not None else None,
        'average_review_count': round(avg_reviews, 2) if avg_reviews is not None else None,
        'type_filter': type_filter,
        'min_rating': min_rating,
        'bookmarks_only': bookmarks_only,
        'sort_by': sort_by,
        'limit': limit,
        'top_businesses': top_businesses,
    })


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def add_review(request):
    """
    Append a user-submitted review to a Business and update its aggregate rating.
    Expected payload: { place_id, rating (1-5), text }
    """
    place_id = request.data.get('place_id')
    text = (request.data.get('text') or '').strip()
    try:
        rating = float(request.data.get('rating'))
    except (TypeError, ValueError):
        rating = None

    if not place_id or not text or rating is None:
        return JsonResponse({'error': 'place_id, text, and numeric rating are required.'}, status=400)

    try:
        business = Business.objects.get(place_id=place_id)
    except Business.DoesNotExist:
        return JsonResponse({'error': 'Business not found'}, status=404)

    reviews = list(business.reviews or [])
    new_review = {
        'author_name': getattr(request.user, 'username', 'Anonymous'),
        'rating': rating,
        'text': text,
        'source': 'user',
    }
    reviews.append(new_review)
    business.reviews = reviews

    # Update aggregate rating and total count
    current_total = business.user_ratings_total or 0
    current_rating = business.rating or 0
    new_total = current_total + 1
    business.rating = round(((current_rating * current_total) + rating) / new_total, 2)
    business.user_ratings_total = new_total

    business.save()
    return JsonResponse(business.return_dict(), safe=False)


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


@csrf_exempt
@api_view(['POST'])
def ai_chat(request):
    """
    Simple AI helper backed by Gemini.
    Expects JSON: { "message": "question text" }
    """
    data = request.data or {}
    message = (data.get('message') or '').strip()
    if not message:
        return JsonResponse({'error': 'message required'}, status=400)

    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        return JsonResponse({'error': 'Gemini API key not configured'}, status=500)

    # Use a model that supports v1beta generateContent (gemini-1.5-flash is deprecated)
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    system_instruction = (
        "You are the helper bot for BusinessFinder, a website that helps people discover local businesses "
        "using Google Maps data. Answer questions about how to use the site, how bookmarking works, roles "
        "(user vs business), and what the map / directory pages do. If asked things unrelated to the app, "
        "answer briefly and politely but do not claim to perform actions in the real world."
    )

    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": message}]}],
    }

    try:
        res = requests.post(
            url,
            params={"key": api_key},
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as e:
        return JsonResponse({'error': 'Gemini request failed', 'details': str(e)}, status=502)

    if res.status_code != 200:
        try:
            err_body = res.json()
        except Exception:
            err_body = res.text
        # Log so you can see the real reason in the runserver terminal
        logger = logging.getLogger(__name__)
        logger.warning("Gemini API non-200: status=%s body=%s", res.status_code, err_body)
        return JsonResponse({
            'error': 'Gemini API error',
            'status_code': res.status_code,
            'details': err_body,
        }, status=502)

    body = res.json() or {}
    try:
        candidates = body.get("candidates") or []
        first = candidates[0]
        parts = (first.get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts)
    except Exception:
        text = ""

    if not text:
        text = "Sorry, I couldn't generate a response. Please try again."

    return JsonResponse({"reply": text})
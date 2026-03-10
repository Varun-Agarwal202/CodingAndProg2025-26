import React, { useEffect, useMemo, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark, faMapMarkerAlt, faStar, faSearch, faTag } from '@fortawesome/free-solid-svg-icons'
import RootLayout from '../layouts/RootLayout'
import { AuthContext } from '../context/AuthContext'
import LoginPromptModal from '../components/LoginPromptModal'
import { useT } from '../utils/useT'

// Deterministic deals helper for directory cards, based on place_id or name
const DEALS_BANK = [
  '10% off your first visit',
  'Buy one, get one 50% off',
  'Free drink with entrée',
  'Free dessert with two entrées',
  'Kids eat free on Tuesdays',
  'Happy hour: 20% off from 3–5pm',
  'Free appetizer with main course',
  'Loyalty card: buy 9, get 10th free',
  'Student discount: 15% off with ID',
  'Senior discount: 10% off on Wednesdays',
  'Free gift with purchases over $50',
  'Weekend special: 2-for-1 on select items',
  'Early bird special: 15% off before 11am',
  'Family bundle deal – save 25%',
  'Free upgrade to large size',
  'No delivery fee on orders over $25',
  'Online-only discount: 10% off',
  'Refer a friend & both get $5 off',
  'Seasonal sale: up to 30% off',
  'New customer coupon: $10 off',
  'Bundle any 3 items & save 20%',
  'Free sample pack with purchase',
  'Birthday reward: free item of your choice',
  'Flash sale: 15% off today only',
  'Free consultation for new clients',
  'Membership deal: extra 5% off',
  'Buy 2 services, get 3rd half off',
  'Complimentary upgrade on first booking',
  'Free trial week for new members',
  'Holiday special: bonus gift card',
  'Neighborhood discount: 10% off',
  'Book online & save 5%',
  'Flat $5 off all orders over $20',
  'Reward points: double points this month',
  'Free eco-friendly tote with purchase',
  'Lunch special: drink included',
  'Morning coffee combo deal',
  'After-school snack special',
  'Midweek special: 2-for-1 tickets',
]

function getDealsForBusiness(business) {
  const key = business.place_id || business.name || 'business'
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const count = (hash % 8) + 1 // 1–8 deals
  const deals = []
  for (let i = 0; i < count; i += 1) {
    const idx = (hash + i * 17) % DEALS_BANK.length
    const deal = DEALS_BANK[idx]
    if (!deals.includes(deal)) {
      deals.push(deal)
    }
  }
  return deals
}

const Directory = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useContext(AuthContext)
  const tt = useT()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [manualLocation, setManualLocation] = useState(() => {
    const stored = localStorage.getItem('manualLocation')
    return stored ? JSON.parse(stored) : null
  })

  const DEFAULT_LOC = { lat: 51.5074, lng: -0.1278 }

  // Try to load saved location or request geolocation
  useEffect(() => {
    const manual = localStorage.getItem('manualLocation')
    if (manual) {
      try {
        setManualLocation(JSON.parse(manual))
      } catch (_) {}
    }
    const stored = localStorage.getItem('userLocation')
    if (stored) {
      try {
        const loc = JSON.parse(stored)
        setUserLocation(loc)
      } catch (_) {}
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          setUserLocation(loc)
          localStorage.setItem('userLocation', JSON.stringify(loc))
        },
        () => {},
        { enableHighAccuracy: false }
      )
    }
  }, [])

  // Load bookmarks if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const loadBookmarks = async () => {
        const token = localStorage.getItem('authToken')
        try {
          const res = await fetch('http://localhost:8000/api/user_bookmarks/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Token ${token}` } : {}),
            },
            credentials: token ? undefined : 'include',
          })
          if (res.ok) {
            const json = await res.json()
            setBookmarkedIds(json.bookmarks || [])
          }
        } catch (err) {
          console.error('Error loading bookmarks:', err)
        }
      }
      loadBookmarks()
    }
  }, [isAuthenticated])

  const getListings = async (q = '', type = '') => {
    setError(null)
    if (!isSearching) setLoading(true)
    try {
      // bookmarked businesses (per-user)
      if (type === 'bookmarks') {
        const token = localStorage.getItem('authToken')
        const res = await fetch('http://localhost:8000/api/user_bookmarks/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
          credentials: token ? undefined : 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const placeIds = json.bookmarks || []

        const businesses = await Promise.all(
          placeIds.map(async (pid) => {
            try {
              const r = await fetch('http://localhost:8000/api/getBusiness/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place_id: pid }),
              })
              if (!r.ok) return null
              return await r.json()
            } catch {
              return null
            }
          })
        )
        setListings(businesses.filter(Boolean))
        return
      }

      // fetch from Google Places API (same as homepage map)
      const loc = manualLocation || userLocation || DEFAULT_LOC
      const lat = typeof loc.latitude !== 'undefined' ? loc.latitude : loc.lat
      const lng = typeof loc.longitude !== 'undefined' ? loc.longitude : loc.lng
      const body = {
        lat: lat ?? DEFAULT_LOC.lat,
        lng: lng ?? DEFAULT_LOC.lng,
        radius: 10,
      }
      if (q) body.query = q
      else if (type) body.type = type

      const response = await fetch('http://localhost:8000/api/nearby_businesses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const raw = Array.isArray(data) ? data : (data.results || [])
      // normalize Google Places format: vicinity -> address
      const normalized = raw.map((b) => ({
        ...b,
        address: b.address || b.vicinity || '',
      }))
      setListings(normalized)
    } catch (err) {
      console.error('Failed to load listings', err)
      setError('Failed to load results')
      setListings([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    // initial load
    getListings()
  }, [])

  // react to filter and location changes
  useEffect(() => {
    if (filter === 'bookmarks') {
      setIsSearching(true)
      getListings('', 'bookmarks')
    } else if (filter && filter !== 'custom') {
      setIsSearching(true)
      getListings('', filter)
    } else if (!filter) {
      setIsSearching(true)
      getListings()
    }
  }, [filter, userLocation, manualLocation])

  const handleSearch = async () => {
    setIsSearching(true)
    // If using custom filter, send the searchQuery as q; otherwise apply filter as type param
    if (filter === 'custom') await getListings(searchQuery.trim(), '')
    else await getListings(searchQuery.trim(), filter)
  }

  const addBookmark = async (placeId, e) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    const already = bookmarkedIds.includes(placeId)
    setBookmarkedIds(prev => (already ? prev.filter(id => id !== placeId) : [...prev, placeId]))

    const token = localStorage.getItem('authToken')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Token ${token}`

    try {
      const res = await fetch('http://localhost:8000/api/add_bookmark/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ business: placeId }),
      })
      if (!res.ok) throw new Error(`Bookmark request failed: ${res.status}`)
    } catch (err) {
      console.error('Bookmark error:', err)
      setBookmarkedIds(prev => (already ? [...prev, placeId] : prev.filter(id => id !== placeId)))
    }
  }

  const sortedListings = useMemo(() => {
    const items = [...listings]
    if (sortBy === 'name') {
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sortBy === 'rating') {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'reviews') {
      items.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))
    }
    return items
  }, [listings, sortBy])
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell bf-page-shell--xwide flex-1 w-full">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ minHeight: 560 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
            {tt('directory.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{tt('directory.subtitle')}</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bf-card mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            {/* Search Input */}
            <div className="flex-1 w-full md:w-auto">
              <label htmlFor="search-input" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                {tt('directory.searchBusinesses')}
              </label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  id="search-input"
                  type="text"
                  placeholder={tt('directory.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  className="bf-input bf-input--icon-left w-full"
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="w-full md:w-auto">
              <label htmlFor="filter-by" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                {tt('directory.filterByCategory')}
              </label>
              <select
                onChange={(e) => setFilter(e.target.value)}
                id="filter-by"
                value={filter}
                className="bf-input min-w-[200px]"
              >
                <option value="">{tt('directory.allCategories')}</option>
                <option value="restaurant">Restaurants</option>
                <option value="cafe">Cafes</option>
                <option value="bar">Bars</option>
                <option value="park">Parks</option>
                <option value="museum">Museums</option>
                <option value="gym">Gyms</option>
                <option value="hospital">Hospitals</option>
                <option value="pharmacy">Pharmacies</option>
                <option value="supermarket">Supermarkets</option>
                <option value="shopping_mall">Shopping Malls</option>
                <option value="movie_theater">Theaters</option>
                <option value="library">Libraries</option>
                <option value="bank">Banks</option>
                <option value="post_office">Post Offices</option>
                <option value="gas_station">Gas Stations</option>
                <option value="lodging">Hotels</option>
                {isAuthenticated && <option value="bookmarks">⭐ My Bookmarked Businesses</option>}
                <option value="custom">{tt('directory.customSearch')}</option>
              </select>
            </div>

            
            {/* Sort Dropdown */}
            <div className="w-full md:w-auto">
              <label htmlFor="sort-by" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                {tt('directory.sortBy')}
              </label>
              <select
                onChange={(e) => setSortBy(e.target.value)}
                id="sort-by"
                value={sortBy}
                className="bf-input min-w-[200px]"
              >
                <option value="">{tt('directory.sortDefault')}</option>
                <option value="name">{tt('directory.sortName')}</option>
                <option value="rating">{tt('directory.sortRating')}</option>
                <option value="reviews">{tt('directory.sortReviews')}</option>
              </select>
            </div>
            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isSearching || (filter === 'custom' && !searchQuery.trim())}
              className="bf-button-primary whitespace-nowrap"
            >
              {isSearching ? tt('directory.searching') : tt('common.search')}
            </button>
          </div>

          {/* Custom text query input */}
          {filter === "custom" && (
            <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700">
              <label htmlFor="custom-query" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                {tt('directory.customQuery')}
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-query"
                  type="text"
                  placeholder={tt('directory.customQueryPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bf-input flex-1"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bf-button-primary"
                >
                  {isSearching ? tt('directory.searching') : tt('common.search')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section - fixed min height so layout doesn't jump when loading */}
        <div className="w-full" style={{ minHeight: 480 }}>
          {loading ? (
            <div className="bf-card p-12 text-center w-full" style={{ minHeight: 420 }}>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">{tt('directory.loadingBusinesses')}</p>
            </div>
          ) : error ? (
            <div className="bf-card p-6 bg-red-900/20 border-red-500/50 w-full" style={{ minHeight: 420 }}>
              <p className="text-red-400">{error}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bf-card p-12 text-center w-full" style={{ minHeight: 420 }}>
              <p className="text-slate-700 dark:text-slate-300 text-lg">{tt('directory.noBusinessesFound')}</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">{tt('directory.tryAdjust')}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-gray-600 dark:text-gray-400">
                {tt('directory.found', {
                  count: sortedListings.length,
                  noun: sortedListings.length === 1 ? tt('directory.businessSingular') : tt('directory.businessPlural'),
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((business) => {
                  const isBookmarked = bookmarkedIds.includes(business.place_id)
                  const deals = getDealsForBusiness(business)
                  return (
                    <div
                      key={business.id || business.place_id}
                      onClick={() => navigate(`/business/${business.place_id}`)}
                      className="bf-card p-6 hover:scale-[1.02] transition-transform cursor-pointer group"
                    >
                      {/* Header with bookmark */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors flex-1 pr-2">
                          {business.name}
                        </h3>
                        <button
                          onClick={(e) => addBookmark(business.place_id, e)}
                          className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <FontAwesomeIcon 
                            icon={faBookmark} 
                            className={isBookmarked ? 'text-yellow-400' : ''}
                          />
                        </button>
                      </div>

                      {/* Address */}
                      {business.address && (
                        <div className="flex items-start gap-2 mb-3 text-gray-600 dark:text-gray-400 text-sm">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-0.5" />
                          <span className="flex-1">{business.address}</span>
                        </div>
                      )}

                      {/* Rating */}
                      {business.rating && (
                        <div className="flex items-center gap-2 mb-4">
                          <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                          <span className="text-slate-900 dark:text-white font-semibold">{business.rating}</span>
                          {business.user_ratings_total && (
                            <span className="text-gray-500 text-sm">
                              ({business.user_ratings_total} {business.user_ratings_total === 1 ? 'review' : 'reviews'})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Types/Categories */}
                      {business.types && business.types.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {business.types.slice(0, 3).map((type, idx) => (
                            <span key={idx} className="bf-pill">
                              {type.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Generic Deals */}
                      <div className="mb-4 space-y-1">
                        {deals.slice(0, 2).map((deal, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400">
                            <FontAwesomeIcon icon={faTag} />
                            <span>{deal}</span>
                          </div>
                        ))}
                      </div>

                      {/* View Details Link */}
                      <div className="text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                        {tt('directory.viewDetails')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
        </div>
      </main>

      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </div>
  )
}

export default Directory






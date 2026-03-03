import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark, faMapMarkerAlt, faStar, faSearch } from '@fortawesome/free-solid-svg-icons'
import RootLayout from '../layouts/RootLayout'
import { AuthContext } from '../context/AuthContext'

const Directory = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useContext(AuthContext)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState([])

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

        // fetch full business objects for each bookmarked place_id
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

      // normal search / filter via backend
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (type) params.append('type', type)
      const url = `http://localhost:8000/api/businesses/${params.toString() ? `?${params.toString()}` : ''}`

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setListings(data)
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

  // react to filter changes (auto-load bookmarks or apply type)
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
  }, [filter])

  const handleSearch = async () => {
    setIsSearching(true)
    // If using custom filter, send the searchQuery as q; otherwise apply filter as type param
    if (filter === 'custom') await getListings(searchQuery.trim(), '')
    else await getListings(searchQuery.trim(), filter)
  }

  const addBookmark = async (placeId, e) => {
    e.stopPropagation()
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
      if (!isAuthenticated) alert('Please log in to save bookmarks.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Business Directory
          </h1>
          <p className="text-gray-400">Discover and explore local businesses in your area</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bf-card mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            {/* Search Input */}
            <div className="flex-1 w-full md:w-auto">
              <label htmlFor="search-input" className="block text-sm font-medium mb-2 text-gray-300">
                Search Businesses
              </label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search by name, address, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  className="bf-input pl-10 w-full"
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="w-full md:w-auto">
              <label htmlFor="filter-by" className="block text-sm font-medium mb-2 text-gray-300">
                Filter By Category
              </label>
              <select
                onChange={(e) => setFilter(e.target.value)}
                id="filter-by"
                value={filter}
                className="bf-input min-w-[200px]"
              >
                <option value="">All Categories</option>
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
                <option value="custom">Custom Search...</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isSearching || (!searchQuery.trim() && filter !== 'custom')}
              className="bf-button-primary whitespace-nowrap"
            >
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Custom text query input */}
          {filter === "custom" && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <label htmlFor="custom-query" className="block text-sm font-medium mb-2 text-gray-300">
                Custom Search Query
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-query"
                  type="text"
                  placeholder='e.g. "pizza near Seattle" or "123 Main St"'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bf-input flex-1"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bf-button-primary"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div>
          {loading ? (
            <div className="bf-card p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-400">Loading businesses...</p>
            </div>
          ) : error ? (
            <div className="bf-card p-6 bg-red-900/20 border-red-500/50">
              <p className="text-red-400">{error}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bf-card p-12 text-center">
              <p className="text-gray-400 text-lg">No businesses found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-gray-600 dark:text-gray-400">
                Found <span className="font-semibold text-slate-900 dark:text-white">{listings.length}</span> {listings.length === 1 ? 'business' : 'businesses'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((business) => {
                  const isBookmarked = bookmarkedIds.includes(business.place_id)
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
                        {isAuthenticated && (
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
                        )}
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

                      {/* View Details Link */}
                      <div className="text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                        View Details →
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
    </div>
  )
}

export default Directory
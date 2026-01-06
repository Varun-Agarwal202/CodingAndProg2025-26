import React, { useEffect, useState } from 'react'
import RootLayout from '../layouts/RootLayout'

const Directory = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

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

  return (
    <div>
      <RootLayout />
      <div>Directory</div>
      <div>
        <h4>Search for a business</h4>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          style={{ width: 300, marginRight: 8 }}
        />
        <button onClick={handleSearch} disabled={isSearching || (!searchQuery.trim() && isSearching === false)}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>

        <label htmlFor="filter-by" style={{ marginLeft: 12, marginRight: 6 }}>Filter By:</label>
        <select
          onChange={(e) => setFilter(e.target.value)}
          id="filter-by"
          value={filter}
          style={{ minWidth: 160 }}
        >
          <option value="">All</option>
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
          <option value="bookmarks">Bookmarked Businesses</option>
          <option value="custom">Custom text query...</option>
        </select>

        {/* custom text query input */}
        {filter === "custom" && (
          <>
            <input
              type="text"
              placeholder='e.g. "pizza near Seattle" or "123 Main St"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 260, marginLeft: 8 }}
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              style={{ marginLeft: 6 }}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </>
        )}

        <div>
          <h2>Business Listings</h2>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : listings.length === 0 ? (
          <p>No results</p>
        ) : (
          <ul>
            {listings.map(business => (
              <li key={business.id || business.place_id}>{business.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Directory
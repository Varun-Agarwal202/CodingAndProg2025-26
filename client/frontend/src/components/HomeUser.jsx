import React, { useEffect, useState, useContext } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { TfiNewWindow } from "react-icons/tfi";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext';

const HomeUser = () => {
  const oldCords = localStorage.getItem("userLocation");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [nearbyBusinesses, setNearbyBusinesses] = useState([]);
  const [radius, setRadius] = useState(5000);

  const { isAuthenticated, user } = useContext(AuthContext);

  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // NEW: state for custom text query
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadBookmarks = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const res = await fetch('http://localhost:8000/api/user_bookmarks/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
          credentials: token ? undefined : 'include',
        });
        if (res.ok) {
          const json = await res.json();
          console.log('Loaded bookmarks:', json);
          setBookmarkedIds(json.bookmarks || []);
        } else {
          setBookmarkedIds([]); 
        }
      } catch (err) {
        console.error('Error loading bookmarks:', err);
        setBookmarkedIds([]);
      }
    };
    loadBookmarks();
  }, [isAuthenticated, user]);
  
  useEffect(() => {
    if (user?.id) localStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds, user]);

  const navigate = useNavigate();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          localStorage.setItem("userLocation", JSON.stringify({ latitude, longitude }));
          setLoading(false);
        },
        (error) => {
          console.error("Error obtaining location:", error);
          setLoading(false);
        },
        { enableHighAccuracy: false, maximumAge: Infinity, timeout: 20000 }
      );
    } else {
      console.log("Geolocation not supported.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation !== null) getNearby();
    else console.log("User location not available yet.");
  }, [userLocation, filter, radius]);

  // updated: accept optional text query (uses Places Text Search when provided)
  const getNearby = async ({ query } = {}) => {
    try {
      setIsSearching(true);
      const body = {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius,
      };
      // if a custom text query was provided, send it as `query` to use textsearch on backend
      if (query) body.query = query;
      else if (filter) body.type = filter;

      const response = await fetch('http://localhost:8000/api/nearby_businesses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log('Nearby Businesses:', data);
      setNearbyBusinesses(data);
    } catch (error) {
      console.error('Error fetching nearby businesses:', error);
    } finally {
      setIsSearching(false);
    }
  };

  function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
  }

  // updated addBookmark that sends auth (token preferred) and updates UI per-user
  const addBookmark = async (placeId) => {
    const already = bookmarkedIds.includes(placeId);

    // optimistic UI update
    setBookmarkedIds(prev => (already ? prev.filter(id => id !== placeId) : [...prev, placeId]));

    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    else headers['X-CSRFToken'] = getCookie('csrftoken');

    try {
      const res = await fetch('http://localhost:8000/api/add_bookmark/', {
        method: 'POST',
        credentials: token ? undefined : 'include',
        headers,
        body: JSON.stringify({ business: placeId }),
      });

      if (!res.ok) {
        throw new Error(`Bookmark request failed: ${res.status}`);
      }
      const data = await res.json();
      console.log('Bookmark response:', data);
    } catch (err) {
      console.error('Bookmark error:', err);
      // revert optimistic change
      setBookmarkedIds(prev => (already ? [...prev, placeId] : prev.filter(id => id !== placeId)));
      if (!isAuthenticated) alert('Please log in to save bookmarks.');
    }
  };

  const center = userLocation 
    ? { lat: userLocation.latitude, lng: userLocation.longitude } 
    : oldCords 
      ? { lat: JSON.parse(oldCords).latitude, lng: JSON.parse(oldCords).longitude } 
      : null;

  return (
    <div>
      {/* controls wrapper - keeps layout stable when custom input appears */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 12
        }}
      >
        <label htmlFor="business-type" style={{ marginRight: 6 }}>Select Business Type:</label>
        <select
          onChange={(e) => setFilter(e.target.value)}
          id="business-type"
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
          <option value="custom">Custom text query...</option>
        </select>

        {/* show input when custom selected */}
        {filter === "custom" && (
          <>
            <input
              type="text"
              placeholder='e.g. "pizza near Seattle" or "123 Main St"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 260, marginLeft: 4 }}
            />
            <button
              onClick={() => getNearby({ query: searchQuery })}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </>
        )}

        <label htmlFor="radius" style={{ marginLeft: 6 }}>Radius (km):</label>
        <input
          type="text"
          id="radius"
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: 90 }}
        />
      </div>

      <div className="container" style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
        <div className="map w-2/3 inline-block" style={{ float: "right" }}>
          {center ? (
            <LoadScript googleMapsApiKey="AIzaSyCoxkur1IMrFgWYnTrdWANhisU2VBM9HaQ">
              <GoogleMap mapContainerStyle={{ height: "400px", width: "100%" }} center={center} zoom={15}>
                <Marker position={center} />
                {nearbyBusinesses.map((business, index) =>
                  business.geometry.location.lat && business.geometry.location.lng ? (
                    <Marker key={index} position={{ lat: business.geometry.location.lat, lng: business.geometry.location.lng }} />
                  ) : null
                )}
              </GoogleMap>
            </LoadScript>
          ) : loading ? (
            <p>Getting your location...</p>
          ) : (
            <p>Location not available.</p>
          )}
        </div>

        <div className="sidebar">
          <h3>Nearby Businesses:</h3>
          <label htmlFor='sort-dropdown'>Sort By: </label>
          <select id="sort-dropdown" onChange={(e) => {
            const sortBy = e.target.value;
            const sortedBusinesses = [...nearbyBusinesses];
            if (sortBy === 'name') {
              sortedBusinesses.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortBy === 'rating') {
              sortedBusinesses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            }
            setNearbyBusinesses(sortedBusinesses);
          }}>
            <option value="">Default</option>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
          </select>

          <ul>
            {nearbyBusinesses.map((business, index) => {
              const isBookmarked = bookmarkedIds.includes(business.place_id);
              return (
                <li className="card" key={index}>
                  <button
                    className="float-end"
                    onClick={() => addBookmark(business.place_id)}
                    aria-pressed={isBookmarked}
                    title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <FontAwesomeIcon icon={faBookmark} style={{ color: isBookmarked ? '#f6e05e' : undefined }} />
                  </button>
                  <br />
                  <strong>{business.name}</strong><br />
                  {business.vicinity}<br />
                  Rating: {business.rating ? business.rating : 'N/A'}
                  <br />
                  <button className="ml-2 px-2 py-1 bg-blue-500 text-white rounded" onClick={() => {
                    const id = business.place_id;
                    const lat = business.geometry.location.lat;
                    const lng = business.geometry.location.lng;
                    navigate(`/business/${id}`, );
                    
                  }}>
                    <TfiNewWindow style={{verticalAlign: 'middle' }} />
                  </button>
  
                </li>
              );
            })}
          </ul> 
        </div>
      </div>
    </div>
  );
};

export default HomeUser;

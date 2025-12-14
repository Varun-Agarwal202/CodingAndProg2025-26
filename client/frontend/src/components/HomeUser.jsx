import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { TfiNewWindow } from "react-icons/tfi";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons'

const HomeUser = () => {
  const oldCords = localStorage.getItem("userLocation");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [nearbyBusinesses, setNearbyBusinesses] = useState([]);
  const [radius, setRadius] = useState(5000);

  // bookmarks: array of place_id strings
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

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

  const getNearby = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/nearby_businesses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          type: filter,
          radius: radius
        }),
      });
      const data = await response.json();
      console.log('Nearby Businesses:', data);
      setNearbyBusinesses(data);
    } catch (error) {
      console.error('Error fetching nearby businesses:', error);
    }
  };

  // toggle bookmark locally + call backend
  const addBookmark = async (business) => {
    const placeId = business.place_id;
    const already = bookmarkedIds.includes(placeId);

    // optimistic UI update
    setBookmarkedIds(prev => already ? prev.filter(id => id !== placeId) : [...prev, placeId]);

    try {
      // adjust endpoint/method if your API uses separate add/remove endpoints
      const response = await fetch('http://localhost:8000/api/add_bookmark/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business }),
      });
      const data = await response.json();
      console.log('Bookmark response:', data);
      // if backend returns failure, revert optimistic change (optional)
      // if (!response.ok) { /* revert state here */ }
    } catch (err) {
      console.error('Bookmark error:', err);
      // revert optimistic change on error
      setBookmarkedIds(prev => already ? [...prev, placeId] : prev.filter(id => id !== placeId));
    }
  };

  const center = userLocation 
    ? { lat: userLocation.latitude, lng: userLocation.longitude } 
    : oldCords 
      ? { lat: JSON.parse(oldCords).latitude, lng: JSON.parse(oldCords).longitude } 
      : null;

  return (
    <div>
      <label htmlFor="business-type">Select Business Type: </label>
      <select onChange={(e) => setFilter(e.target.value)} id="business-type">
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
      </select>
      <label htmlFor="radius"> Enter Radius (meters): </label>
      <input type="text" id="radius" onChange={(e) => setRadius(e.target.value)} />
      <div className="container" style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
        <div className="map w-2/3 inline-block" style={{ float: "right" }}>
          {center ? (
            <LoadScript googleMapsApiKey="AIzaSyCq8572ZvPfCWw9uEi0tEw6M2m75H5F1kU">
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

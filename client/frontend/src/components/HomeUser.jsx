import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const HomeUser = () => {
  const oldCords = localStorage.getItem("userLocation");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [nearbyBusinesses, setNearbyBusinesses] = useState([]);

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
  }, [userLocation, filter]);

  const getNearby = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/nearby_businesses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          type: filter,
        }),
      });
      const data = await response.json();
      console.log('Nearby Businesses:', data);
      setNearbyBusinesses(data);
    } catch (error) {
      console.error('Error fetching nearby businesses:', error);
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

      {center ? (
        <LoadScript googleMapsApiKey="AIzaSyCq8572ZvPfCWw9uEi0tEw6M2m75H5F1kU">
          <GoogleMap mapContainerStyle={{ height: "400px", width: "100%" }} center={center} zoom={15}>
            <Marker position={center} />
            {nearbyBusinesses.map((business, index) => 
              business.latitude && business.longitude ? (
                <Marker key={index} position={{ lat: business.latitude, lng: business.longitude }} />
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
  );
};

export default HomeUser;

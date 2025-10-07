import React, { useEffect, useState } from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const HomeUser = () => {
  const oldCords = localStorage.getItem("userLocation");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log("HI");
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
        { enableHighAccuracy: false, maximumAge: Infinity,  timeout: 20000} // 10 seconds timeout
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    getNearby();
  }, [userLocation]);

  const getNearby = async () => {
    if (userLocation) {
      try {
        const response = await fetch('http://localhost:8000/api/nearby_businesses/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          }),
        });
        const data = await response.json();
        console.log('Nearby Businesses:', data);
      } catch (error) {
        console.error('Error fetching nearby businesses:', error);
      }
    }
  };


  const center = userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude }
    : oldCords ? { lat: JSON.parse(oldCords).latitude, lng: JSON.parse(oldCords).longitude } : null;

  return (
    <div>
      {center ? (
        <LoadScript googleMapsApiKey="AIzaSyCq8572ZvPfCWw9uEi0tEw6M2m75H5F1kU">
          <GoogleMap
            mapContainerStyle={{ height: "400px", width: "100%" }}
            center={center}
            zoom={15}
          >
            <Marker position={center} />
          </GoogleMap>
        </LoadScript>
        
      ) : loading ? (
        <p>Getting your location...</p>
      ) : (
        <p>Location not available.</p>
      )}
    </div>
  )
}

export default HomeUser;
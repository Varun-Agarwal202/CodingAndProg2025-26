import React, { use } from 'react'
import RootLayout from '../layouts/RootLayout';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import HomeUser from '../components/HomeUser';
const Home = () => {
  const {isAuthenticated, user} = useContext(AuthContext);
  console.log(isAuthenticated, "home");
  return (
    <div>
    <RootLayout />
    {isAuthenticated ? <HomeUser /> : <h2>Please log in.</h2>}
    </div>
  )
}

export default Home;
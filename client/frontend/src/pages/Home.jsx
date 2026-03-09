import React, { useContext } from 'react'
import RootLayout from '../layouts/RootLayout';
import { AuthContext } from '../context/AuthContext';
import HomeUser from '../components/HomeUser';
import HomeBusiness from '../components/HomeBusiness';

const Home = () => {
  const { isAuthenticated, role } = useContext(AuthContext);
  const showMap = !isAuthenticated || role !== 'business';

  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />

      {showMap ? (
        <main className="bf-page-shell bf-page-shell--xwide flex-1 w-full">
          <HomeUser />
        </main>
      ) : (
        <main className="bf-page-shell flex-1">
          <HomeBusiness />
        </main>
      )}
    </div>
  )
}

export default Home
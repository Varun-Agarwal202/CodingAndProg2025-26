import React, { useContext } from 'react'
import Navbar from '../components/Navbar';
import NavbarLoggedIn from '../components/NavbarLoggedIn';
import { AuthContext } from '../context/AuthContext';
const RootLayout = () => {
    const {isAuthenticated, user} = useContext(AuthContext);
    console.log(isAuthenticated);
    return (
        <div>
    {isAuthenticated ? <NavbarLoggedIn /> : <Navbar />}
    </div>
)
}

export default RootLayout
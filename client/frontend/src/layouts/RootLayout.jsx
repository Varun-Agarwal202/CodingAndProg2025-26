import React, { useContext } from 'react'
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import NavbarBusiness from '../components/NavbarBusiness'; // NEW
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import AiChatWidget from '../components/AiChatWidget';

const RootLayout = () => {
    const { isAuthenticated, role } = useContext(AuthContext);
    // show business navbar for business role, logged-in navbar for normal users
    if (isAuthenticated && role === 'business') {
      return (
        <>
          <NavbarBusiness />
          <AccessibilityToolbar />
          <AiChatWidget />
        </>
      )
    }
    return (
      <>
        <Navbar />
        <AccessibilityToolbar />
        <AiChatWidget />
      </>
    )
}

export default RootLayout
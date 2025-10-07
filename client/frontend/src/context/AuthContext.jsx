import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    console.log(token);
    if (token) {
      setIsAuthenticated(true)
      
      const userData = JSON.parse(localStorage.getItem('user')) // or fetch from API
      setUser(userData)
    } else {
      setIsAuthenticated(false)
      setUser(null)
    }
  }, [])
  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser , logout}}>
      {children}
    </AuthContext.Provider>
  )
}
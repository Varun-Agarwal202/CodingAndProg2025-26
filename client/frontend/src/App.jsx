import { useState } from 'react'
import reactLogo from './assets/react.svg'
import {Routes, Route} from 'react-router-dom'
import viteLogo from '/vite.svg'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Directory from './pages/Directory'
import BusinessPage from './pages/BusinessPage'

function App() {

  return (
    <Routes>
      <Route path="/" element = {<Home />} />
      <Route path="/login" element = {<Login />} />
      <Route path="/signup" element = {<Signup />} />
      <Route path = "/business/:id" element = {<BusinessPage />} />
      <Route path = "/directory" element = {<Directory />} />
      <Route path="*" element={<h2>Page Not Found</h2>} />
    </Routes>
  )
}

export default App

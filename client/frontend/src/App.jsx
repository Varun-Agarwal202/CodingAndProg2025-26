import { useState } from 'react'
import reactLogo from './assets/react.svg'
import {Routes, Route} from 'react-router-dom'
import viteLogo from '/vite.svg'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {

  return (
    <Routes>
      <Route path="/" element = {<Home />} />
      <Route path="/login" element = {<Login />} />
      <Route path="/signup" element = {<Signup />} />
    </Routes>
  )
}

export default App

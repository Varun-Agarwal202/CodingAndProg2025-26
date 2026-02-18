import React from 'react'
import RootLayout from '../layouts/RootLayout'

const About = () => {
  return (
    <div>
      <RootLayout />
      <div className="p-6">
        <h1 className="text-3xl font-bold">About BusinessFinder</h1>
        <p className="mt-4">
          BusinessFinder helps users discover and support local businesses.
        </p>
      </div>
    </div>
  )
}

export default About

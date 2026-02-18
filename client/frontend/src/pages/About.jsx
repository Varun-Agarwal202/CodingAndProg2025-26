import React from 'react'
import RootLayout from '../layouts/RootLayout'

const About = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <RootLayout />
      <main className="p-6 text-gray-900 dark:text-gray-100">
        <h1 className="text-3xl font-bold">About BusinessFinder</h1>
        <p className="mt-4">
          BusinessFinder helps users discover and support local businesses.
        </p>
      </main>
    </div>
  )
}

export default About

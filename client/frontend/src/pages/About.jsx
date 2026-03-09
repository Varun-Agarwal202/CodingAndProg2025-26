import React from 'react'
import RootLayout from '../layouts/RootLayout'

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell flex-1 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">About BusinessFinder</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            BusinessFinder helps users discover and support local businesses.
          </p>
        </header>
        <section className="bf-card p-5 md:p-6">
          <p className="text-slate-700 dark:text-slate-300">
            BusinessFinder helps users discover and support local businesses.
          </p>
        </section>
      </main>
    </div>
  )
}

export default About

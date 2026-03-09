import React from 'react'
import RootLayout from '../layouts/RootLayout'

const Services = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell flex-1 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Our Services</h1>
        <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
          BusinessFinder helps you discover and support local businesses. Here’s what we offer.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Discover nearby businesses</h2>
          <p className="text-slate-700 dark:text-slate-300">
            When you’re logged in, we use your location (with your permission) to show businesses near you on an interactive map. Choose a business type—restaurants, cafés, parks, gyms, and more—and set how far you’re willing to go. Results update so you can explore what’s around you.
          </p>
        </section>

        <section className="bf-card p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Search by type or custom query</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Filter by category (e.g. restaurants, museums, pharmacies) or use a custom text search to find exactly what you’re looking for. You can also adjust the search radius in kilometres to narrow or widen the area.
          </p>
        </section>

        <section className="bf-card p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Save favourites with bookmarks</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Log in to bookmark businesses you like. Your saved list is stored to your account so you can return to them later from any device.
          </p>
        </section>

        <section className="bf-card p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Business directory and details</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Browse the directory for a list view of businesses, or open a business to see more details—address, contact info, ratings, and more—so you can decide where to go.
          </p>
        </section>

        <section className="bf-card p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">How to get started</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Sign up or log in, allow location when prompted (or use the default area), and start exploring. Use the map and sidebar to browse, bookmark places you like, and open any listing for full details.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Services

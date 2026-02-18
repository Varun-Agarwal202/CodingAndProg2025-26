import React from 'react'
import RootLayout from '../layouts/RootLayout'

const Services = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <RootLayout />
      <main className="p-6 text-gray-900 dark:text-gray-100 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Our Services</h1>
        <p className="mt-4 text-lg">
          BusinessFinder helps you discover and support local businesses. Here’s what we offer.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Discover nearby businesses</h2>
          <p>
            When you’re logged in, we use your location (with your permission) to show businesses near you on an interactive map. Choose a business type—restaurants, cafés, parks, gyms, and more—and set how far you’re willing to go. Results update so you can explore what’s around you.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Search by type or custom query</h2>
          <p>
            Filter by category (e.g. restaurants, museums, pharmacies) or use a custom text search to find exactly what you’re looking for. You can also adjust the search radius in kilometres to narrow or widen the area.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Save favourites with bookmarks</h2>
          <p>
            Log in to bookmark businesses you like. Your saved list is stored to your account so you can return to them later from any device.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Business directory and details</h2>
          <p>
            Browse the directory for a list view of businesses, or open a business to see more details—address, contact info, ratings, and more—so you can decide where to go.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">How to get started</h2>
          <p>
            Sign up or log in, allow location when prompted (or use the default area), and start exploring. Use the map and sidebar to browse, bookmark places you like, and open any listing for full details.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Services

import React from 'react'
import RootLayout from '../layouts/RootLayout'

const Contact = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <RootLayout />
      <main className="p-6 text-gray-900 dark:text-gray-100 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-4">Get in touch with the BusinessFinder team.</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Send a message</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input type="text" id="name" placeholder="Your name" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input type="email" id="email" placeholder="your@email.com" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
              <textarea id="message" rows={4} placeholder="Your message..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Other ways to reach us</h2>
          <p><strong>Email:</strong> contact@businessfinder.example</p>
          <p className="mt-2"><strong>Address:</strong> Your address here.</p>
        </section>
      </main>
    </div>
  )
}

export default Contact

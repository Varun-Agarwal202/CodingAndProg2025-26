import React from 'react'
import RootLayout from '../layouts/RootLayout'

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell bf-page-shell--xwide flex-1">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">Contact Us</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Get in touch with the BusinessFinder team.</p>
        </header>

        <section className="bf-card p-5 md:p-6 mb-6 w-full max-w-full">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Send a message</h2>
          <form className="space-y-4 w-full">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
              <input type="text" id="name" placeholder="Your name" className="bf-input w-full" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" id="email" placeholder="your@email.com" className="bf-input w-full" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Message</label>
              <textarea id="message" rows={4} placeholder="Your message..." className="bf-input w-full" />
            </div>
            <button type="submit" className="bf-button-primary">Submit</button>
          </form>
        </section>

        <section className="bf-card p-5 md:p-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Other ways to reach us</h2>
          <p className="text-slate-700 dark:text-slate-300"><strong>Email:</strong> contact@businessfinder.example</p>
          <p className="mt-2 text-slate-700 dark:text-slate-300"><strong>Address:</strong> Your address here.</p>
        </section>
      </main>
    </div>
  )
}

export default Contact

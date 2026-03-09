import React from 'react'
import RootLayout from '../layouts/RootLayout'
import { useT } from '../utils/useT'

const Contact = () => {
  const tt = useT()
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell bf-page-shell--xwide flex-1">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">{tt('contact.title')}</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">{tt('contact.subtitle')}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] items-start">
          <section className="bf-card p-5 md:p-6 w-full">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{tt('contact.sendMessage')}</h2>
            <form className="space-y-4 w-full">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{tt('contact.name')}</label>
                <input type="text" id="name" placeholder={tt('contact.namePlaceholder')} className="bf-input w-full" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{tt('contact.email')}</label>
                <input type="email" id="email" placeholder={tt('contact.emailPlaceholder')} className="bf-input w-full" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{tt('contact.message')}</label>
                <textarea id="message" rows={6} placeholder={tt('contact.messagePlaceholder')} className="bf-input w-full" />
              </div>
              <button type="submit" className="bf-button-primary">{tt('contact.submit')}</button>
            </form>
          </section>

          <section className="bf-card p-5 md:p-6 w-full">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{tt('contact.otherWays')}</h2>
            <p className="text-slate-700 dark:text-slate-300"><strong>{tt('contact.emailLabel')}</strong> contact@businessfinder.example</p>
            <p className="mt-2 text-slate-700 dark:text-slate-300"><strong>{tt('contact.addressLabel')}</strong> Your address here.</p>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Contact

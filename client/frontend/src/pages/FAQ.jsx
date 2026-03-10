import React from 'react'
import RootLayout from '../layouts/RootLayout'
import { useT } from '../utils/useT'

const FAQ = () => {
  const tt = useT()
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell flex-1 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{tt('faq.title')}</h1>
        <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
          {tt('faq.intro')}
        </p>
        <section className="bf-card p-5 md:p-6 mb-6 mt-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{tt('faq.boostTitle')}</h2>
          <p className="text-slate-700 dark:text-slate-300 text-sm">
            {tt('faq.boostBody')}
          </p>
          <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.interfaceLabel')}</span>{' '}
            <span>{tt('faq.interfaceValue')}</span>
          </div>
        </section>
        <section className="bf-card p-5 md:p-6 mb-6 mt-8">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{tt('faq.promptHeading')}</h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            {tt('faq.promptQuote')}
          </p>
          <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 text-sm">
            <li>{tt('faq.req1')}</li>
            <li>{tt('faq.req2')}</li>
            <li>{tt('faq.req3')}</li>
            <li>{tt('faq.req4')}</li>
            <li>{tt('faq.req5')}</li>
            <li>{tt('faq.req6')}</li>
          </ul>
        </section>

        <section className="bf-card p-5 md:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{tt('faq.howWeMeet')}</h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature1Title')}</h3>
              <p className="text-sm">{tt('faq.feature1Body')}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature2Title')}</h3>
              <p className="text-sm">{tt('faq.feature2Body')}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature3Title')}</h3>
              <p className="text-sm">{tt('faq.feature3Body')}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature4Title')}</h3>
              <p className="text-sm">{tt('faq.feature4Body')}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature5Title')}</h3>
              <p className="text-sm">{tt('faq.feature5Body')}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature6Title')}</h3>
              <p className="text-sm">{tt('faq.feature6Body')}</p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">{tt('faq.feature7Title')}</h3>
              <p className="text-sm">{tt('faq.feature7Body')}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default FAQ


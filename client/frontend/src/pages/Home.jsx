import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import RootLayout from '../layouts/RootLayout';
import { AuthContext } from '../context/AuthContext';
import HomeUser from '../components/HomeUser';
import HomeBusiness from '../components/HomeBusiness';
import CommunitySpotlight from '../components/CommunitySpotlight';
import { useT } from '../utils/useT';

const Home = () => {
  const { isAuthenticated, role } = useContext(AuthContext);
  const showMap = !isAuthenticated || role !== 'business';
  const navigate = useNavigate()
  const tt = useT()

  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />

      {showMap ? (
        <main className="flex-1 bf-hero-gradient" role="main">
          <section className="bf-page-shell bf-page-shell--xwide mx-auto grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center pt-10 pb-12 lg:pt-14 lg:pb-16">
            <div className="space-y-7 text-left max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bf-pill text-slate-900 dark:text-slate-100">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                {tt('home.badge')}
              </span>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {tt('home.titleA')}
                <span className="text-sky-400">{tt('home.titleB')}</span>
              </h1>
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-400 max-w-xl">
                {tt('home.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/directory')}
                  className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-slate-950 transition-colors"
                >
                  {tt('home.browseDirectory')}
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:border-sky-500 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-200"
                >
                  {tt('home.contactUs')}
                </button>
              </div>
            </div>

            <div className="bf-card p-5 md:p-6 lg:p-7">
              <CommunitySpotlight />
            </div>
          </section>

          <section className="bf-page-shell bf-page-shell--xwide mx-auto pb-10 lg:pb-14">
            <HomeUser />
          </section>
        </main>
      ) : (
        <main className="bf-page-shell flex-1">
          <HomeBusiness />
        </main>
      )}
    </div>
  )
}

export default Home
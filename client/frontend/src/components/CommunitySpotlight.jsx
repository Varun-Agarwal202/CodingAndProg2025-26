import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../utils/useT'

const DEFAULT_LOCATION = { latitude: 51.5074, longitude: -0.1278 }

function readStoredLocation() {
  const manualLoc = localStorage.getItem('manualLocation')
  const userLoc = localStorage.getItem('userLocation')
  const stored = manualLoc || userLoc
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

const CommunitySpotlight = () => {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const tt = useT()

  const radiusKm = useMemo(() => {
    const r = localStorage.getItem('userRadius')
    const n = r ? Number(r) : 10
    return Number.isFinite(n) && n > 0 ? n : 10
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchFeatured = async () => {
      setLoading(true)
      try {
        // Prefer server-managed spotlight list. This allows business owners
        // to request a spotlight slot while still falling back to high-rated
        // local businesses if none are configured.
        const response = await fetch(
          `http://localhost:8000/api/community_spotlight/?limit=4&radius=${radiusKm}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        const raw = Array.isArray(data) ? data : []

        const cleaned = raw
          .filter((x) => x && x.place_id && x.name)

        if (mounted) setFeatured(cleaned)
      } catch (err) {
        console.error('Error fetching community spotlight:', err)
        if (mounted) setFeatured([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchFeatured()

    const handleRefresh = () => fetchFeatured()
    window.addEventListener('radiusChanged', handleRefresh)
    window.addEventListener('manualLocationChanged', handleRefresh)
    window.addEventListener('storage', (e) => {
      if (e.key === 'userLocation' || e.key === 'manualLocation' || e.key === 'userRadius') handleRefresh()
    })

    return () => {
      mounted = false
      window.removeEventListener('radiusChanged', handleRefresh)
      window.removeEventListener('manualLocationChanged', handleRefresh)
    }
  }, [radiusKm])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{tt('spotlight.loading')}</p>
      </div>
    )
  }

  if (featured.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-600 dark:text-slate-400">{tt('spotlight.empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{tt('home.communitySpotlight')}</h3>
      <div className="space-y-3">
        {featured.map((resource) => (
          <div
            key={resource.place_id}
            onClick={() => navigate(`/business/${resource.place_id}`)}
            className="p-4 rounded-lg border border-slate-300 dark:border-slate-700/70 bg-white dark:bg-slate-900/70 hover:border-sky-500 dark:hover:border-sky-500/70 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors truncate">
                  {resource.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {resource.vicinity || resource.formatted_address || ' '}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-yellow-500 dark:text-yellow-400 text-xs">⭐</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{resource.rating || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/directory')}
        className="w-full mt-4 px-4 py-2 text-sm font-medium text-sky-600 dark:text-sky-300 border border-sky-500 dark:border-sky-500/50 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
      >
        {tt('home.viewAllBusinesses')}
      </button>
    </div>
  )
}

export default CommunitySpotlight
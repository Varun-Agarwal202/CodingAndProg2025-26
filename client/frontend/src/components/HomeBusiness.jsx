import React, { useEffect, useState } from 'react'
import { useT } from '../utils/useT'

const HomeBusiness = () => {
  const tt = useT()
  const [businesses, setBusinesses] = useState([])
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const [requestError, setRequestError] = useState('')
  const [loadingBusinesses, setLoadingBusinesses] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoadingBusinesses(true)
      setRequestError('')
      try {
        const res = await fetch('http://localhost:8000/api/businesses/')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setBusinesses(list)
        if (list.length && !selectedPlaceId) {
          setSelectedPlaceId(list[0].place_id)
        }
      } catch (err) {
        console.error('Failed to load businesses for spotlight request:', err)
        setRequestError('Could not load businesses. Please try again later.')
      } finally {
        setLoadingBusinesses(false)
      }
    }
    loadBusinesses()
  }, [])

  const handleRequestSpotlight = async () => {
    if (!selectedPlaceId) {
      setRequestError('Please choose a business first.')
      return
    }
    setSubmitting(true)
    setRequestError('')
    setRequestStatus('')
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('http://localhost:8000/api/request_spotlight/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({ place_id: selectedPlaceId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      if (data.already_spotlight) {
        setRequestStatus('This business is already in the community spotlight.')
      } else {
        setRequestStatus('Thanks! Your business has been added to the community spotlight.')
      }
    } catch (err) {
      console.error('Spotlight request error:', err)
      setRequestError(err.message || 'Failed to request spotlight.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="p-6 text-gray-900 dark:text-gray-100 max-w-3xl mx-auto space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
        <p className="mt-4">
          Welcome — this view is shown to business accounts. From here you can manage how your
          business appears across the site.
        </p>
      </section>

      <section className="bf-card p-5 md:p-6">
        <h2 className="text-xl font-semibold mb-2">Request Community Spotlight</h2>
        <p className="text-sm text-slate-300 mb-4">
          Ask to feature one of your businesses in the Community Spotlight on the homepage. When
          accepted, it will replace one of the existing spotlight cards.
        </p>

        {loadingBusinesses ? (
          <p className="text-sm text-slate-400">Loading your businesses…</p>
        ) : businesses.length === 0 ? (
          <p className="text-sm text-slate-400">
            We don&apos;t have any businesses stored yet. Try searching in the directory first so
            we can cache your place, then come back here.
          </p>
        ) : (
          <>
            <label
              htmlFor="spotlight-business"
              className="block text-sm font-medium mb-2 text-slate-100"
            >
              Choose your business
            </label>
            <select
              id="spotlight-business"
              className="bf-input w-full mb-3"
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
            >
              {businesses.map((b) => (
                <option key={b.place_id} value={b.place_id}>
                  {b.name} — {b.address}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleRequestSpotlight}
              disabled={submitting || !selectedPlaceId}
              className="bf-button-primary text-sm"
            >
              {submitting ? 'Submitting…' : 'Request spotlight'}
            </button>

            {requestStatus && (
              <p className="mt-3 text-sm text-emerald-400">{requestStatus}</p>
            )}
            {requestError && (
              <p className="mt-3 text-sm text-red-400">{requestError}</p>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default HomeBusiness
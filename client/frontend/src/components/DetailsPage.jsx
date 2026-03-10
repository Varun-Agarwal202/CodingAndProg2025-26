import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { useT } from '../utils/useT'

const DetailsPage = ({ data }) => {
  const tt = useT()
  const navigate = useNavigate()
  const { isAuthenticated } = useContext(AuthContext)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [localData, setLocalData] = useState(data || null)
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [includeCategories, setIncludeCategories] = useState(true)
  const [includeDeals, setIncludeDeals] = useState(true)

  const effectiveData = localData || data

  if (!effectiveData) return <div>{tt('details.loading')}</div>

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!reviewText.trim() || !reviewRating) {
      setSubmitError(tt('details.reviewRequired') || 'Please enter a review and rating.')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('http://localhost:8000/api/add_review/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          place_id: effectiveData.place_id,
          text: reviewText.trim(),
          rating: Number(reviewRating),
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }

      const updated = await res.json()
      setLocalData(updated)
      setReviewText('')
      setReviewRating('')
      setSubmitSuccess(tt('details.reviewSubmitted') || 'Review submitted!')
    } catch (err) {
      console.error('Review submit error:', err)
      setSubmitError(tt('details.reviewFailed') || 'Failed to submit review. Please try again.')
    }
  }

  const handleBusinessReport = async () => {
    if (!effectiveData.place_id) return
    setReportError('')
    setReport(null)
    setReportLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('http://localhost:8000/api/generate_report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: 'business',
          place_id: effectiveData.place_id,
          sort_by: 'reviews',
          limit: 1,
        }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setReport(json)
    } catch (err) {
      console.error('Business report error:', err)
      setReportError('Failed to generate data report for this business.')
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
      {/* Top summary */}
      <div className="mb-8 space-y-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-500 dark:text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          Local business profile
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
          {effectiveData.name}
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <span className="mt-0.5">📍</span>
          <span>{effectiveData.address}</span>
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-amber-300 px-3 py-1 text-xs md:text-sm">
            <span className="text-lg">⭐</span>
            <span className="font-semibold">
              {effectiveData.rating ?? 'N/A'}
            </span>
            {typeof effectiveData.user_ratings_total === 'number' && (
              <span className="text-slate-300">
                ({effectiveData.user_ratings_total}{' '}
                {effectiveData.user_ratings_total === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Phone:{' '}
            <span className="font-medium">
              {effectiveData.contact_number || 'N/A'}
            </span>
          </p>
          {effectiveData.website && (
            <a
              href={effectiveData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sky-500 hover:text-sky-400 text-sm font-medium"
            >
              Visit website
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>

      {/* Photos */}
      {effectiveData.photos && effectiveData.photos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-50">
            {tt('details.photos')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {effectiveData.photos?.slice(0, 8).map((photoUrl, index) => (
              <img
                key={index}
                src={photoUrl}
                alt={`${effectiveData.name} photo ${index + 1}`}
                className="w-full h-40 md:h-48 object-cover rounded-lg shadow-sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Opening hours */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{tt('details.openingHours')}</h2>
        {effectiveData.opening_hours?.weekday_text?.map((hours, index) => (
          <p key={index} className="mb-1">{hours}</p>
        ))}
      </div>

      {/* Reviews list */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-50">
          {tt('details.reviews')}
        </h2>
        <div className="space-y-4">
          {effectiveData.reviews?.length ? (
            effectiveData.reviews.map((review, index) => (
              <div
                key={index}
                className="border border-slate-800/70 bg-slate-900/40 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-100">
                    {review.author_name}
                  </p>
                  <p className="ml-4 text-amber-300 text-sm">
                    {'⭐'.repeat(Math.round(review.rating || 0))}
                  </p>
                </div>
                <p className="text-sm text-slate-200">{review.text}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">
              No reviews yet. Be the first to share your experience.
            </p>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Business data report</h2>
        <button
          type="button"
          onClick={handleBusinessReport}
          disabled={reportLoading}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {reportLoading ? 'Generating…' : 'Generate report for this business'}
        </button>
        {report && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-800 dark:text-gray-100">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-400"
                checked={includeCategories}
                onChange={(e) => setIncludeCategories(e.target.checked)}
              />
              Include categories
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-slate-400"
                checked={includeDeals}
                onChange={(e) => setIncludeDeals(e.target.checked)}
              />
              Include deals
            </label>
          </div>
        )}
        {reportError && (
          <p className="mt-3 text-sm text-red-500">{reportError}</p>
        )}
        {report && (
          <>
            <div className="mt-4 border rounded-lg p-4 shadow-sm card text-sm text-gray-800 dark:text-gray-100">
              <p><strong>Total businesses in scope:</strong> {report.total_businesses}</p>
              <p><strong>Average rating:</strong> {report.average_rating ?? 'N/A'}</p>
              <p><strong>Average reviews per business:</strong> {report.average_review_count ?? 'N/A'}</p>
            </div>
            <button
              type="button"
              className="mt-3 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm"
              onClick={() => {
                const title = `Business Report – ${effectiveData.name}`
                const dateStr = new Date().toLocaleString()
                const b = (report.top_businesses && report.top_businesses[0]) || effectiveData
                const summaryRows = `
                  <p><strong>Business:</strong> ${b.name || ''}</p>
                  <p><strong>Address:</strong> ${b.address || ''}</p>
                  <p><strong>Rating:</strong> ${b.rating ?? 'N/A'} (${b.user_ratings_total ?? 0} reviews)</p>
                `
                const categories = includeCategories ? (b.types || []).slice(0, 5).join(', ') : ''
                const dealsCount = includeDeals ? (b.deals || []).length : 0
                const dealsList = includeDeals
                  ? (b.deals || []).map((d) => `<li>${d}</li>`).join('')
                  : ''

                const html = `
                  <html>
                    <head>
                      <title>${title}</title>
                      <style>
                        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
                        h1 { font-size: 24px; margin-bottom: 4px; }
                        h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
                        ul { margin-left: 20px; }
                      </style>
                    </head>
                    <body onload="window.print()">
                      <h1>${title}</h1>
                      <p><em>Generated on ${dateStr}</em></p>
                      ${summaryRows}
                      ${includeCategories ? `<h2>Categories</h2><p>${categories || 'N/A'}</p>` : ''}
                      ${includeDeals ? `<h2>Deals (${dealsCount})</h2><ul>${dealsList}</ul>` : ''}
                    </body>
                  </html>
                `

                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const w = window.open(url, '_blank', 'noopener,noreferrer')
                if (w) {
                  w.focus()
                }
              }}
            >
              Download business report as PDF
            </button>
          </>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">{tt('details.leaveReview')}</h2>
        {!isAuthenticated ? (
          <div className="border rounded-lg p-4 shadow-sm card">
            <p className="text-gray-700 mb-3">{tt('details.loginToReview')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => navigate('/login')}
              >
                {tt('auth.login')}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300"
                onClick={() => navigate('/signup')}
              >
                {tt('auth.signup')}
              </button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 shadow-sm card">
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="reviewText">{tt('details.yourReview')}</label>
                <textarea
                  id="reviewText"
                  className="w-full p-2 border rounded-lg"
                  rows="4"
                  placeholder="Write your review here..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="rating">{tt('details.rating')}</label>
                <select
                  id="rating"
                  className="w-full p-2 border rounded-lg"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                >
                  <option value="">{tt('details.selectRating')}</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {tt('details.submitReview')}
              </button>
              {submitError && (
                <p className="mt-3 text-sm text-red-500">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="mt-3 text-sm text-green-500">{submitSuccess}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailsPage;
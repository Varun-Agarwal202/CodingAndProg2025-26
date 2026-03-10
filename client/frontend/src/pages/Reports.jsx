import React, { useState, useContext } from 'react'
import RootLayout from '../layouts/RootLayout'
import { AuthContext } from '../context/AuthContext'
import { useT } from '../utils/useT'

const Reports = () => {
  const { isAuthenticated } = useContext(AuthContext)
  const tt = useT()
  const [typeFilter, setTypeFilter] = useState('')
  const [minRating, setMinRating] = useState('')
  const [bookmarksOnly, setBookmarksOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating')
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [includeCategories, setIncludeCategories] = useState(true)
  const [includeDeals, setIncludeDeals] = useState(true)

  const handleGenerate = async () => {
    setError('')
    setReport(null)
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('http://localhost:8000/api/generate_report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: 'directory',
          type: typeFilter || null,
          min_rating: minRating || null,
          bookmarks_only: bookmarksOnly || false,
          sort_by: sortBy,
          limit,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }

      const json = await res.json()
      setReport(json)
    } catch (err) {
      console.error('Generate report error:', err)
      setError('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell flex-1 w-full">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
              Data Reports
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
              Build a customizable report over businesses in the directory. Choose filters and sorting to analyze ratings, reviews, and categories.
            </p>
          </header>

          <section className="bf-card mb-8 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Configure report
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bf-input w-full"
                >
                  <option value="">All categories</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="cafe">Cafes</option>
                  <option value="bar">Bars</option>
                  <option value="park">Parks</option>
                  <option value="museum">Museums</option>
                  <option value="gym">Gyms</option>
                  <option value="hospital">Hospitals</option>
                  <option value="pharmacy">Pharmacies</option>
                  <option value="supermarket">Supermarkets</option>
                  <option value="shopping_mall">Shopping Malls</option>
                  <option value="movie_theater">Theaters</option>
                  <option value="library">Libraries</option>
                  <option value="bank">Banks</option>
                  <option value="post_office">Post Offices</option>
                  <option value="gas_station">Gas Stations</option>
                  <option value="lodging">Hotels</option>
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Leave blank to include all categories.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Minimum rating
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="bf-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bf-input w-full"
                >
                  <option value="rating">Highest rating</option>
                  <option value="reviews">Most reviews</option>
                  <option value="deals">Most deals</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Max businesses in report
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 1)}
                  className="bf-input w-full"
                />
              </div>
            </div>

            {isAuthenticated && (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="rounded border-slate-400"
                  checked={bookmarksOnly}
                  onChange={(e) => setBookmarksOnly(e.target.checked)}
                />
                Only include my bookmarked businesses
              </label>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-slate-400"
                  checked={includeCategories}
                  onChange={(e) => setIncludeCategories(e.target.checked)}
                />
                Include categories in report
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-slate-400"
                  checked={includeDeals}
                  onChange={(e) => setIncludeDeals(e.target.checked)}
                />
                Include deals in report
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="bf-button-primary"
            >
              {loading ? 'Generating…' : 'Generate report'}
            </button>

            {report && (
              <button
                type="button"
                onClick={() => {
                  const title = 'BusinessFinder Data Report'
                  const dateStr = new Date().toLocaleString()
                  const summaryRows = `
                    <p><strong>Total businesses:</strong> ${report.total_businesses}</p>
                    <p><strong>Average rating:</strong> ${report.average_rating ?? 'N/A'}</p>
                    <p><strong>Avg. reviews per business:</strong> ${report.average_review_count ?? 'N/A'}</p>
                  `

                  const tableRows = (report.top_businesses || [])
                    .map((b) => {
                      const baseCols = `
                        <td>${b.name || ''}</td>
                        <td>${b.address || ''}</td>
                        <td>${b.rating ?? 'N/A'}</td>
                        <td>${b.user_ratings_total ?? 0}</td>
                      `
                      const categoriesCol = includeCategories
                        ? `<td>${(b.types || []).slice(0, 3).join(', ')}</td>`
                        : ''
                      const dealsCol = includeDeals
                        ? `<td>${(b.deals || []).length}</td>`
                        : ''
                      return `<tr>${baseCols}${categoriesCol}${dealsCol}</tr>`
                    })
                    .join('')

                  const html = `
                    <html>
                      <head>
                        <title>${title}</title>
                        <style>
                          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }
                          h1 { font-size: 24px; margin-bottom: 4px; }
                          h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
                          table { width: 100%; border-collapse: collapse; font-size: 12px; }
                          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
                          th { background: #f3f4f6; }
                        </style>
                      </head>
                      <body onload="window.print()">
                        <h1>${title}</h1>
                        <p><em>Generated on ${dateStr}</em></p>
                        ${summaryRows}
                        <h2>Top businesses</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Address</th>
                              <th>Rating</th>
                              <th>Reviews</th>
                              ${includeCategories ? '<th>Categories</th>' : ''}
                              ${includeDeals ? '<th>Deals</th>' : ''}
                            </tr>
                          </thead>
                          <tbody>
                            ${tableRows}
                          </tbody>
                        </table>
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
                className="bf-button-secondary"
              >
                Download as PDF
              </button>
            )}

            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}
          </section>

          {report && (
            <section className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bf-card p-4">
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Total businesses
                  </p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {report.total_businesses}
                  </p>
                </div>
                <div className="bf-card p-4">
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Average rating
                  </p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {report.average_rating ?? 'N/A'}
                  </p>
                </div>
                <div className="bf-card p-4">
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Avg. reviews per business
                  </p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {report.average_review_count ?? 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bf-card p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-50">
                  Top businesses
                </h2>
                {report.top_businesses && report.top_businesses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-slate-700">
                        <tr className="text-left text-slate-300">
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Address</th>
                          <th className="py-2 pr-4">Rating</th>
                          <th className="py-2 pr-4">Reviews</th>
                          {includeCategories && <th className="py-2 pr-4">Categories</th>}
                          {includeDeals && <th className="py-2 pr-4">Deals</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {report.top_businesses.map((b) => (
                          <tr key={b.place_id} className="border-b border-slate-800/60 last:border-none">
                            <td className="py-2 pr-4">{b.name}</td>
                            <td className="py-2 pr-4">{b.address}</td>
                            <td className="py-2 pr-4">{b.rating ?? 'N/A'}</td>
                            <td className="py-2 pr-4">{b.user_ratings_total ?? 0}</td>
                            {includeCategories && (
                              <td className="py-2 pr-4">
                                {(b.types || []).slice(0, 3).join(', ')}
                              </td>
                            )}
                            {includeDeals && (
                              <td className="py-2 pr-4">
                                {(b.deals || []).length}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No businesses matched your report filters.</p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Reports


import React, { useState } from 'react'
import { useT } from '../utils/useT'

const AiChatWidget = () => {
  const tt = useT()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setError('')
    const userMsg = { role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/ai_chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Request failed')
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }])
    } catch (e) {
      console.error('AI chat error', e)
      setError('Sorry, the helper is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg px-4 py-2 text-sm font-semibold"
      >
        AI Help
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl flex flex-col">
          <header className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-50">BusinessFinder Helper</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ×
            </button>
          </header>
          <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-800">
            Ask questions about how to use the map, directory, bookmarks, or accounts.
          </div>
          <div className="flex-1 max-h-64 overflow-y-auto px-3 py-2 space-y-2 text-sm">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500">
                Try asking: &quot;How do I change my location?&quot; or &quot;What does the directory do?&quot;
              </p>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-lg px-3 py-2 max-w-full ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-slate-950 ml-auto'
                    : 'bg-slate-800 text-slate-100 mr-auto'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-slate-500">
                {tt('common.loading')}
              </p>
            )}
            {error && (
              <p className="text-xs text-rose-400">
                {error}
              </p>
            )}
          </div>
          <form
            className="border-t border-slate-800 px-3 py-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
          >
            <input
              type="text"
              className="bf-input flex-1 text-xs"
              placeholder="Ask a question about this site..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bf-button-primary text-xs px-3 disabled:opacity-60"
            >
              {tt('common.search')}
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default AiChatWidget


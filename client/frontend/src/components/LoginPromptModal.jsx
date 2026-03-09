import React from 'react'
import { useNavigate } from 'react-router-dom'

const LoginPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleLogin = () => {
    onClose()
    navigate('/login')
  }

  const handleSignup = () => {
    onClose()
    navigate('/signup')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bf-card p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Save bookmarks
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Please log in to save bookmarks. Don&apos;t have an account? Create one to get started.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleLogin}
            className="flex-1 bf-button-primary"
          >
            Log in
          </button>
          <button
            onClick={handleSignup}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-medium text-sm hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors"
          >
            Create account
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default LoginPromptModal

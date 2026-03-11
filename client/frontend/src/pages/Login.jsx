import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RootLayout from '../layouts/RootLayout';
import { redirect } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useT } from '../utils/useT'

const Login = () => {
  const navigate = useNavigate();
  const tt = useT()
  const [formData, setFormData] = useState({
          username: "",
          password: "",
      });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setIsAuthenticated, setUser, setRole } = useContext(AuthContext)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaContainerRef = useRef(null);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);

  // Ensure the v2 checkbox widget is explicitly rendered and we track its widgetId.
  useEffect(() => {
    const renderRecaptcha = () => {
      if (!window.grecaptcha || !recaptchaContainerRef.current) {
        return;
      }
      try {
        const id = window.grecaptcha.render(recaptchaContainerRef.current, {
          sitekey: '6LeOcoUsAAAAAH6ymT1xEc6bXYvGpH3fDk4xb5Ut',
        });
        setRecaptchaWidgetId(id);
      } catch (err) {
        console.error('reCAPTCHA render error:', err);
      }
    };

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      renderRecaptcha();
      return;
    }

    const intervalId = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        clearInterval(intervalId);
        renderRecaptcha();
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, []);
  
  const handleChange = (e) => {
      setFormData({
          ...formData,
          [e.target.name]: e.target.value
      });
      console.log(formData);
  };
 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (
    !window.grecaptcha ||
    typeof window.grecaptcha.getResponse !== 'function' ||
    recaptchaWidgetId === null
  ) {
    setError("reCAPTCHA is still loading. Please wait a moment and try again.");
    return;
  }

  let recaptchaToken = "";
  try {
    recaptchaToken = window.grecaptcha.getResponse(recaptchaWidgetId);
  } catch (err) {
    console.error("reCAPTCHA getResponse error:", err);
    setError("reCAPTCHA is not ready yet. Please wait a second and try again.");
    return;
  }
  if (!recaptchaToken) {
    setError("Please complete the reCAPTCHA.");
    return;
  }

  setIsSubmitting(true);

  try {
    const res = await axios.post(
      'http://localhost:8000/auth/login/',
      { ...formData, recaptcha_token: recaptchaToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    // Save the token first
    localStorage.setItem("authToken", res.data.key);

    const userRes = await axios.get('http://localhost:8000/auth/user/', {
      headers: { Authorization: `Token ${res.data.key}` }
    });
    console.log('[Login] /auth/user/ payload:', userRes.data);
    const userData = userRes.data;

    // Fetch profile/role from dedicated endpoint
    let resolvedRole = null;
    try {
      const profileRes = await axios.get('http://localhost:8000/api/my_profile/', {
        headers: { Authorization: `Token ${res.data.key}` }
      });
      console.log('[Login] /api/my_profile/ payload:', profileRes.data);
      resolvedRole = profileRes.data?.role || null;
    } catch (e) {
      console.error('[Login] failed to fetch my_profile:', e);
    }
    console.log('[Login] resolvedRole:', resolvedRole);

    setIsAuthenticated(true);
    setUser(userData);
    if (resolvedRole) {
      setRole(resolvedRole);
      localStorage.setItem('role', resolvedRole);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setSuccess(tt('login.success'));
    navigate('/');
  } catch (err) {
    console.error("Login error:", err.response?.data || err);
    const apiError = err.response?.data?.detail || tt('login.failed');
    setError(apiError);
  } finally {
    setIsSubmitting(false);
    // reset the widget so the user can retry
    try {
      if (window.grecaptcha && recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
    } catch (e) {
      // ignore reset errors
    }
  }
};
  return (
    <div className="min-h-screen flex flex-col">
      <RootLayout />
      <main className="bf-page-shell flex-1 flex items-center justify-center">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center w-full">
          {/* Left: Hero copy */}
          <section className="space-y-6 text-left animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-300 bf-pill">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {tt('login.badge')}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {tt('login.titleA')}
              <span className="text-sky-400">{tt('login.titleB')}</span>.
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl">
              {tt('login.subtitle')}
            </p>
          </section>

          {/* Right: Auth card */}
            <section className="bf-card w-full max-w-md mx-auto p-6 md:p-7 lg:p-8 animate-fade-in-up" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
            <header className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50">{tt('login.cardTitle')}</h2>
                <p className="mt-1.5 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                {tt('login.cardSubtitle')}
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <label htmlFor="username" className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {tt('auth.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder={tt('login.usernamePlaceholder')}
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="bf-input w-full"
                />
              </div>

              <div className="space-y-2 text-left">
                <label htmlFor="password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {tt('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder={tt('login.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bf-input w-full"
                />
              </div>

              <div className="flex justify-start">
                <div ref={recaptchaContainerRef} />
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 rounded-md px-3 py-2">
                  {success}
                </p>
              )}

              <button
                type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 focus-visible:ring-offset-slate-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? tt('login.submitting') || 'Signing in...' : tt('login.submit')}
              </button>
            </form>

            <p className="mt-5 text-xs text-slate-400 text-center">
              {tt('login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="font-medium text-sky-500 dark:text-sky-400 hover:text-sky-400 dark:hover:text-sky-300 underline underline-offset-4"
              >
                {tt('login.createOne')}
              </button>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Login
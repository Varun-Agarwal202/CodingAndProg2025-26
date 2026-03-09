import React, { useState, useContext } from 'react';
import RootLayout from '../layouts/RootLayout';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useT } from '../utils/useT';

export default function Signup ()  {
    const navigate = useNavigate();
    const { setIsAuthenticated, setUser, setRole } = useContext(AuthContext);
    const tt = useT();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password1: "",
        password2: "",
        role: "user", // new role field
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    function getCookie(name) {
        const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return v ? v.pop() : '';
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            const csrf = getCookie('csrftoken');
            const reg = await fetch("http://localhost:8000/auth/registration/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf,
                },
                credentials: "include",
                body: JSON.stringify(formData),
            });
            if (!reg.ok) {
                const err = await reg.json().catch(() => ({ detail: reg.statusText }));
                const msg = err.detail || err.error || (reg.status === 500 ? "Server error. Please try again." : "Registration failed");
                throw new Error(Array.isArray(msg) ? msg.join(" ") : msg);
            }

            // try to login the new user so /auth/user/ reflects the new account
            // (skip this if you require email confirmation before login)
            const login = await fetch("http://localhost:8000/auth/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: formData.username, password: formData.password1 }),
            });

            if (login.ok) {
                const loginRes = await login.json();
                // Store token so AuthContext can find it
                if (loginRes.key) localStorage.setItem('authToken', loginRes.key);
                const userRes = await fetch("http://localhost:8000/auth/user/", { credentials: "include" });
                if (userRes.ok) {
                    const userJson = await userRes.json();
                    console.log('[Signup] /auth/user/ payload:', userJson);
                    setUser(userJson);

                    // fetch profile/role from dedicated endpoint
                    try {
                      const profileRes = await fetch("http://localhost:8000/api/my_profile/", {
                        method: "GET",
                        headers: { "Content-Type": "application/json", Authorization: `Token ${loginRes.key}` },
                      });
                      if (profileRes.ok) {
                        const profileJson = await profileRes.json();
                        console.log('[Signup] /api/my_profile/ payload:', profileJson);
                        const resolvedRole = profileJson?.role || null;
                        console.log('[Signup] resolvedRole:', resolvedRole);
                        if (resolvedRole) {
                          setRole(resolvedRole);
                          localStorage.setItem('role', resolvedRole);
                        }
                      } else {
                        console.warn('[Signup] /api/my_profile/ not ok, status:', profileRes.status);
                      }
                    } catch (e) {
                      console.error('[Signup] failed to fetch my_profile:', e);
                    }

                    setIsAuthenticated(true);
                } else {
                    console.warn('[Signup] /auth/user/ not ok after login, status:', userRes.status);
                }
            } else {
                // email-confirmation flows often block immediate login
                setSuccess("Registered. Check your email to confirm before logging in.");
            }

            navigate("/");
        } catch (err) {
            setError(err.message || "Signup error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
      <div className="min-h-screen flex flex-col">
        <RootLayout />
        <main className="bf-page-shell flex-1 flex items-center justify-center">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center w-full">
            <section className="space-y-6 text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium bf-pill text-slate-900 dark:text-slate-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {tt('signup.badge')}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {tt('signup.titleA')}
                <span className="text-sky-500 dark:text-sky-400">{tt('signup.titleB')}</span>.
              </h1>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl">
                {tt('signup.subtitle')}
              </p>
            </section>

            {/* Right: Signup card */}
            <section className="bf-card w-full max-w-md mx-auto p-6 md:p-7 lg:p-8">
              <header className="mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50">{tt('signup.cardTitle')}</h2>
                <p className="mt-1.5 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                  {tt('signup.cardSubtitle')}
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
                    placeholder={tt('signup.usernamePlaceholder')}
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="bf-input w-full"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label htmlFor="email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    {tt('auth.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder={tt('signup.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bf-input w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 text-left">
                    <label htmlFor="password1" className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {tt('auth.password')}
                    </label>
                    <input
                      id="password1"
                      type="password"
                      name="password1"
                      placeholder={tt('signup.passwordPlaceholder')}
                      value={formData.password1}
                      onChange={handleChange}
                      required
                      className="bf-input w-full"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label htmlFor="password2" className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {tt('signup.confirmPassword')}
                    </label>
                    <input
                      id="password2"
                      type="password"
                      name="password2"
                      placeholder={tt('signup.confirmPasswordPlaceholder')}
                      value={formData.password2}
                      onChange={handleChange}
                      required
                      className="bf-input w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label htmlFor="role" className="block text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    {tt('signup.accountType')}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="user">{tt('signup.accountUser')}</option>
                    <option value="business">{tt('signup.accountBusiness')}</option>
                  </select>
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
                  className="mt-1 bf-button-primary w-full disabled:opacity-70"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? tt('signup.submitting') : tt('signup.submit')}
                </button>
              </form>

              <p className="mt-5 text-xs text-slate-400 text-center">
                {tt('signup.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-medium text-sky-500 dark:text-sky-400 hover:text-sky-400 dark:hover:text-sky-300 underline underline-offset-4"
                >
                  {tt('signup.loginLink')}
                </button>
              </p>
            </section>
          </div>
        </main>
      </div>
    );
}

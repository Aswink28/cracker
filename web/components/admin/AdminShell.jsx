'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  Megaphone,
  LogOut,
  Loader2,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { fetchMe, login as apiLogin, logout as apiLogout, getToken, errorMessage } from '@/lib/adminApi';
import { store } from '@/lib/config';
import { cn } from '@/lib/format';

const AdminContext = createContext(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used inside AdminShell');
  return context;
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/announcements', label: 'Offers strip', icon: Megaphone },
];

/**
 * Authentication gate and chrome for the admin panel.
 *
 * The gate here is a convenience, not the security boundary - it only decides
 * what to render. Every write is authorised server-side by requireAdmin, so a
 * user who bypasses this UI still cannot change anything.
 */
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!getToken()) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setAdmin(me);
      } catch {
        // Interceptor already cleared the bad token.
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    apiLogout();
    setAdmin(null);
  }

  if (checking) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-400" aria-hidden="true" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  if (!admin) {
    return <LoginScreen onSuccess={setAdmin} />;
  }

  return (
    <AdminContext.Provider value={{ admin, logout: handleLogout }}>
      {/*
        Deliberately unlike the storefront header: a dark full-bleed bar, no
        logo, no search, no cart. The visual break is the point - it should be
        obvious at a glance whether you are looking at the shop or the admin.
      */}
      <div className="flex min-h-screen flex-col bg-ink-100">
        <header className="bg-ink-950 text-white">
          <div className="container-page">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck className="h-4 w-4 text-gold-300" strokeWidth={2.2} aria-hidden="true" />
                  {store.name} - Admin
                </p>
                <p className="truncate text-xs text-ink-400">
                  Signed in as {admin.name} ({admin.email})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <Store className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                  View site
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>

            <nav aria-label="Admin" className="-mb-px overflow-x-auto">
              <ul className="flex gap-1">
                {NAV.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
                          active
                            ? 'border-gold-400 text-white'
                            : 'border-transparent text-ink-400 hover:text-white',
                        )}
                      >
                        <item.icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </header>

        <main className="container-page flex-1 py-6">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}

function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const me = await apiLogin(email.trim(), password);
      onSuccess(me);
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-card border border-ink-200 bg-white p-6"
      >
        <h1 className="text-xl font-bold text-ink-950">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink-500">{store.name}</p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-ink-800">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-medium text-ink-800"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="input"
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

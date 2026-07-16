import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../../app/store';

const LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/documents', label: 'Documents' },
];

export default function AppShell() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  function resetDemo() {
    if (!confirm('Reset all demo data and start over?')) return;
    dispatch({ type: 'RESET_DEMO' });
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-bg font-body text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <NavLink to="/home" className="flex items-center gap-2 font-display text-xl text-secondary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <svg viewBox="0 0 56 56" width="18" height="18">
                <path d="M37 19a10 10 0 1 0 0 18" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="34" cy="28" r="2.6" fill="#E8A838" />
              </svg>
            </span>
            Coverly
          </NavLink>

          {state.policy && (
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Product">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-light text-primary' : 'text-ink-soft hover:text-secondary'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {state.user && (
              <span className="hidden text-sm text-ink-soft sm:inline">{state.user.name}</span>
            )}
            <button
              onClick={resetDemo}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-red-200 hover:text-red-600"
            >
              Reset demo
            </button>
          </div>
        </div>
        {state.policy && (
          <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-1.5 sm:hidden" aria-label="Product">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-primary-light text-primary' : 'text-ink-soft'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

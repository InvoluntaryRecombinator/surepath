/**
 * <MarketingLayout> — the content site's shell (SITE_STRUCTURE §1). Header with nav,
 * footer with the trust line. No session, nothing sensitive. The application at
 * /<state>/apply has its own shell and no marketing header.
 */
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Mark } from '../ui/icons'

const nav = [
  { to: '/states', label: 'Where it works' },
  { to: '/faq', label: 'Questions' },
  { to: '/about', label: 'About' },
]

export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[18px] font-extrabold tracking-tight text-ink">SurePath</span>
          </Link>
          <nav className="flex items-center gap-7" aria-label="Site">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `text-[14.5px] font-medium transition-colors duration-150 ${
                    isActive ? 'text-accent' : 'text-ink hover:text-accent'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to="/texas"
              className="inline-flex h-10 items-center rounded-[4px] bg-accent px-4 text-[14.5px] font-semibold text-field transition-opacity duration-150 hover:opacity-92"
            >
              Start in Texas
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-1.5 px-8 py-7">
          <p className="text-[13.5px] font-medium text-ink">
            Nothing leaves your browser. No account, no database — your information stays on
            your computer.
          </p>
          <p className="text-[12.5px] leading-relaxed text-muted">
            SurePath is a document-preparation tool, not a law firm, and does not give legal
            advice. The licensing board makes every determination — SurePath helps you ask it
            the question.
          </p>
        </div>
      </footer>
    </div>
  )
}

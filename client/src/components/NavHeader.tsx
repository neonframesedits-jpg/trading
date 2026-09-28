import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

export function NavHeader() {
  const location = useLocation();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="shrink-0">
          <span className="sm:hidden">
            <Logo withWordmark={false} />
          </span>
          <span className="hidden sm:block">
            <Logo />
          </span>
        </Link>
        <nav className="flex min-w-0 gap-0.5 overflow-x-auto whitespace-nowrap text-sm sm:gap-1">
          <NavLink to="/" active={location.pathname === "/"}>
            Screener
          </NavLink>
          <NavLink to="/news" active={location.pathname.startsWith("/news")}>
            News
          </NavLink>
          <NavLink to="/goals" active={location.pathname.startsWith("/goals")}>
            Goals
          </NavLink>
          <NavLink to="/data-status" active={location.pathname.startsWith("/data-status")}>
            Data status
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`rounded-lg px-2 py-1.5 transition sm:px-3 ${
        active ? "bg-emerald-600/20 text-emerald-400" : "text-neutral-400 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

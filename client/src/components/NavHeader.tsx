import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

export function NavHeader() {
  const location = useLocation();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="flex gap-1 text-sm">
          <NavLink to="/" active={location.pathname === "/"}>
            Screener
          </NavLink>
          <NavLink to="/goals" active={location.pathname.startsWith("/goals")}>
            Goals
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
      className={`rounded-lg px-3 py-1.5 transition ${
        active ? "bg-emerald-600/20 text-emerald-400" : "text-neutral-400 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

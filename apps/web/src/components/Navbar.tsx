import { Menu, X, LogOut, User as UserIcon, CreditCard, Shield } from "lucide-react";
import { useState } from "react";
import { nav } from "../content/site";
import { useUi } from "./useUi";
import { Button, Logo } from "./ui";

export function Navbar() {
  const { openLogin, openScan, currentUser, logout, navigate, currentPath } = useUi();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    close();
    if (href === "#pricing") {
      e.preventDefault();
      navigate("/pricing");
    } else if (currentPath !== "/") {
      // If on another page and clicking an anchor, navigate back to / with anchor
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          className="shrink-0 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
          onClick={() => {
            close();
            navigate("/");
          }}
        >
          <Logo compact />
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(item.href, e)}
              className={`rounded-full px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                item.href === "#pricing" && currentPath === "/pricing"
                  ? "bg-white/10 text-white font-medium"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}

          {currentUser ? (
            <>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className={`rounded-full px-3 py-2 text-sm transition focus-visible:outline-signal ${
                  currentPath === "/pricing"
                    ? "bg-signal/15 text-signal font-semibold"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Dedicated Pricing
              </button>

              <button
                type="button"
                onClick={() => navigate("/billing")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition focus-visible:outline-signal ${
                  currentPath === "/billing"
                    ? "bg-signal/15 text-signal font-semibold"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <CreditCard size={14} />
                <span>Billing & Subscriptions</span>
              </button>
            </>
          ) : null}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/billing")}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 hover:bg-white/10 transition"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name || currentUser.email}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-signal/20 text-xs font-semibold text-signal">
                    <UserIcon size={14} />
                  </span>
                )}
                <span className="text-xs font-medium text-zinc-200">
                  {currentUser.name || currentUser.email.split("@")[0]}
                </span>
              </button>

              <Button
                variant="ghost"
                onClick={logout}
                className="px-3 text-xs text-zinc-400 hover:text-white"
              >
                <LogOut size={14} />
                Sign Out
              </Button>

              <Button onClick={() => navigate("/app")}>
                <Shield size={14} />
                Dashboard
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={openLogin}>
                Login
              </Button>
              <Button onClick={openScan}>Start Scanning</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-white/8 bg-ink px-4 py-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                close();
                navigate("/");
              }}
              className="text-left rounded-xl px-3 py-3 text-sm text-zinc-200 hover:bg-white/5"
            >
              Overview
            </button>
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    navigate("/pricing");
                  }}
                  className="text-left rounded-xl px-3 py-3 text-sm text-signal font-medium hover:bg-white/5"
                >
                  Dedicated Pricing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    navigate("/billing");
                  }}
                  className="text-left rounded-xl px-3 py-3 text-sm text-zinc-200 hover:bg-white/5"
                >
                  Billing & Subscriptions
                </button>
              </>
            ) : null}
          </nav>
          <div className="mt-3 flex gap-2">
            {currentUser ? (
              <Button
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => {
                  close();
                  logout();
                }}
              >
                Sign Out ({currentUser.name || currentUser.email.split("@")[0]})
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    close();
                    openLogin();
                  }}
                >
                  Login
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    close();
                    openScan();
                  }}
                >
                  Start Scanning
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

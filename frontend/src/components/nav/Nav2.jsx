import { useState } from 'react';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { name: 'Tools', href: '/' },
    { name: 'Blog', href: '/' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* transparent + slight blur so it stays visible on scroll */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-4 rounded-2xl bg-transparent backdrop-blur-sm">
          <nav className="flex items-center justify-start gap-4 px-4 py-2 text-slate-100">
            {/* Left: Logo */}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <img src="/icons/logo.png" alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">True </span>Form
              </span>
            </a>

            {/* Desktop nav */}
            <ul className="hidden md:flex items-center gap-8 text-sm ml-auto mr-8">
              {navItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="relative px-3 py-1 rounded-md opacity-80 transition-all transform hover:scale-110 hover:border hover:border-white hover:opacity-100"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Right: Sign in */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="#signin"
                className="inline-flex items-center rounded-full bg-white/5 px-4 py-2 text-sm font-medium ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-white/10 transition-colors"
              >
                Sign in
              </a>
            </div>

            {/* Mobile: menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10 focus:outline-none"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </nav>

          {/* Mobile panel */}
          <div
            id="mobile-nav"
            className={`${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'} md:hidden grid overflow-hidden transition-[grid-template-rows] duration-300`}
          >
            <div className="overflow-hidden">
              <ul className="flex flex-col gap-2 px-4 pb-4 text-slate-100/90 text-sm">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="block rounded-lg px-3 py-2 hover:bg-white/5">
                      {item.name}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#signin" className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10 hover:bg-white/10">
                    Sign in
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

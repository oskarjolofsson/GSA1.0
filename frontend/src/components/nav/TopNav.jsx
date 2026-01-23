import { useState } from 'react';
import { useAuth } from '../../auth/authContext.jsx';

// Components and icons
import ProfileDropdown from './DropDown.jsx';

function leftLogo() {
  return (
    <a href="/" className="flex items-center gap-2 shrink-0">
      <img src="/icons/true_swing_logo3.png" alt="Logo" className="h-8 w-8" />
      <span className="text-xl font-bold tracking-tight">
        <span className="text-white">True </span>Swing
      </span>
    </a>
  );
}

function desktopNav(navItems) {
  return (
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
  );
}

import SignInPopup from '../popup/signInPopup.jsx';

function SignIn({ mobile = false }) {
  const { login, loading, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  let text = "";
  let onClick = () => {};

  if (user) {
    return null; // Don't show account button if logged in (show settings instead)
  }

  if (loading) {
    text = "Loading...";
  } else {
    text = "Sign in / Register";
    onClick = () => setShowPopup(prevState => !prevState);
  }

  // desktop: hidden on small screens, flex from md up
  // mobile: show only on small screens
  const wrapperClass = mobile ? 'flex md:hidden items-center gap-3 w-full justify-center' : 'hidden md:flex items-center gap-3';
  const buttonClass = mobile
    ? 'inline-flex w-full max-w-xs items-center justify-center rounded-lg bg-white/5 px-4 py-2 text-sm font-medium ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-60'
    : 'inline-flex items-center rounded-full bg-white/5 px-4 py-2 text-sm font-medium ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-60';

  return (
    <div className={wrapperClass}>
      <button
        onClick={onClick}
        type="button"
        disabled={loading}
        className={buttonClass}
      >
        {text}
      </button>

      {showPopup && !user && (
        <SignInPopup onStartSignIn={login} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}

function mobileMenuButton(open, setOpen, controlsId = 'mobile-nav') {
  return (
    <button
      className="md:hidden inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/10 focus:outline-none"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-controls={controlsId}
      aria-label="Toggle navigation"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

function mobilePanel(open, navItems) {
  return (
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
            {/* Use the account method for mobile */}
            <div className="mt-1 w-full flex items-center justify-center">
              <SignIn mobile />
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}


export default function NavBar() {
  const [open, setOpen] = useState(false);

  const navItems = [
    //{ name: 'Home', href: '/' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-4 rounded-2xl bg-transparent">
          <nav className="flex items-center justify-start gap-4 px-4 py-2 text-slate-100">
            {leftLogo()}
            {desktopNav(navItems)}
            <SignIn />
            <ProfileDropdown />
            {navItems.length > 0 &&
              mobileMenuButton(open, setOpen)
            }

          </nav>
          {mobilePanel(open, navItems)}
        </div>
      </div>
    </header>
  );
}


import { Link } from "react-router-dom";

function UpperBar() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
      {Brand()}
      {Columns()}
    </div>
  );
}


function Brand() {
  return (
    <div className="col-span-2 sm:col-span-1">
      <Link to="/" className="flex items-center gap-2">
        <img src="/icons/true_swing_logo3.png" alt="Logo" className="h-8 w-8" />
        <span className="text-xl font-bold tracking-tight">
          <span className="text-white">True </span>Swing
        </span>
      </Link>
    </div>
  );
}


function Columns() {
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">PRODUCT</h3>
        <ul className="space-y-2 text-sm">
          <li><Link to="/#features" className="hover:text-white">Features</Link></li>
          <li><Link to="/#faq" className="hover:text-white">FAQ</Link></li>
          <li><Link to="/products" className="hover:text-white">Products</Link></li>

        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">RESOURCES</h3>
        <ul className="space-y-2 text-sm">
          <li><a href="mailto:trueswing25@gmail.com" className="hover:text-white">Contact</a></li>
          <li><a href="mailto:trueswing25@gmail.com" className="hover:text-white">Support</a></li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">LEGAL</h3>
        <ul className="space-y-2 text-sm">
          <li><Link to="/legal/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
          <li><Link to="/legal/terms-and-conditions" className="hover:text-white">Terms</Link></li>
        </ul>
      </div>
    </>
  );
}


function LowerBar() {
  return (
    <div className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        {LowerLeft()}
        {Instagram()}
      </div>
    </div>
  );
}


function LowerLeft() {
  return (
    <p>
      Shipped from 🇸🇪 • © 2025 Oskar O.
    </p>
  );
}


function Instagram() {
  return (
    <div className="flex items-center gap-4 text-slate-400">
      <a href="https://www.instagram.com/trueswing25/" className="hover:text-white">
        <svg
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.75-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z" />
        </svg>
      </a>
    </div>
  );
}

function FaceBook() {
  return (
    <div className="flex items-center gap-4 text-slate-400">
      <a href="https://www.instagram.com/trueswing25/" className="hover:text-white">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.2-1.5 1.6-1.5H16.7V5.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V11H6.7v3h2.8v8h4z" />
        </svg>
      </a>
    </div>
  );
}

function TikTok() {
  return (
    <div className="flex items-center gap-4 text-slate-400">
      <a href="https://www.instagram.com/trueswing25/" className="hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="TikTok"> <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/> </svg>
      </a>
    </div>
  );
}


export default function Footer() {
  return (
    <footer className="bg-[#0b1020] text-slate-300 border-t border-white/10">
      {UpperBar()}
      {LowerBar()}
    </footer>
  );
}

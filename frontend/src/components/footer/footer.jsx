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
        {LowerRight()}
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


function LowerRight() {
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


export default function Footer() {
  return (
    <footer className="bg-[#0b1020] text-slate-300 border-t border-white/10">
      {UpperBar()}
      {LowerBar()}
    </footer>
  );
}

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
          <li><Link to="/" className="hover:text-white">Support</Link></li>
          <li><Link to="/" className="hover:text-white">Contact</Link></li>
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
      <a href="https://github.com/oskarjolofsson/GSA1.0" className="hover:text-white">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.547-1.387-1.34-1.757-1.34-1.757-1.093-.747.084-.732.084-.732 1.207.084 1.84 1.238 1.84 1.238 1.074 1.84 2.813 1.309 3.5 1 .107-.776.42-1.31.762-1.611-2.666-.305-5.467-1.334-5.467-5.933 0-1.313.469-2.387 1.238-3.229-.123-.305-.537-1.527.117-3.176 0 0 1.01-.322 3.301 1.23a11.47 11.47 0 0 1 3.004-.404c1.02.004 2.047.137 3.004.404 2.291-1.552 3.299-1.23 3.299-1.23.656 1.649.242 2.871.119 3.176.77.842 1.236 1.916 1.236 3.229 0 4.609-2.805 5.625-5.479 5.922.432.373.818 1.104.818 2.229v3.293c0 .318.191.693.799.576C20.566 21.797 24 17.297 24 12c0-6.63-5.373-12-12-12z" /></svg>
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

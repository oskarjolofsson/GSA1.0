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
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        {LowerLeft()}

        <div className="flex items-center gap-3">
          <Reddit/>
          <FaceBook/>
          <Instagram/>
        </div>
        
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
    <div className="flex items-center text-slate-400">
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
    <div className="flex items-center text-slate-400">
      <a href="https://www.facebook.com/people/True-Swing/61585578701767/" className="hover:text-white">
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

/*function TikTok() {
  return (
    <div className="flex items-center text-slate-400">
      <a href="https://www.instagram.com/trueswing25/" className="hover:text-white">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        > <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/> </svg>
      </a>
    </div>
  );
}*/

function Reddit() {
  return (
    <div className="flex items-center text-slate-400">
      <a
        href="https://www.reddit.com/user/true__swing/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-white transition"
        aria-label="Reddit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 -4 48 48"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M31.14 26.326c-1.794 0-3.302-1.442-3.302-3.22 0-1.777 1.508-3.267 3.302-3.267s3.249 1.49 3.249 3.267c0 1.778-1.455 3.22-3.249 3.22m.762 6.248c-1.671 1.655-4.248 2.459-7.878 2.459l-.025-.002-.026.002c-3.63 0-6.205-.804-7.875-2.459a1.29 1.29 0 0 1 0-1.837 1.32 1.32 0 0 1 1.854 0c1.152 1.142 3.121 1.698 6.021 1.698l.026.001.025-.001c2.9 0 4.87-.556 6.024-1.698a1.32 1.32 0 0 1 1.854 0c.511.509.511 1.33 0 1.837m-18.291-9.468c0-1.776 1.504-3.267 3.297-3.267s3.249 1.491 3.249 3.267c0 1.778-1.455 3.22-3.249 3.22-1.793 0-3.297-1.442-3.297-3.22M39.996 2.598c1.215 0 2.203.98 2.203 2.182a2.196 2.196 0 0 1-2.203 2.183 2.196 2.196 0 0 1-2.203-2.183c0-1.202.988-2.182 2.203-2.182M48 19.57c0-3.152-2.587-5.716-5.769-5.716a5.77 5.77 0 0 0-3.635 1.283c-3.517-2.191-7.981-3.511-12.766-3.79l2.496-7.82 6.86 1.6c.18 2.476 2.267 4.435 4.81 4.435 2.66 0 4.824-2.145 4.824-4.782 0-2.635-2.165-4.78-4.824-4.78a4.84 4.84 0 0 0-4.283 2.582l-7.97-1.86a1.31 1.31 0 0 0-1.55.873L23.094 11.3c-5.156.124-10.002 1.449-13.777 3.767a5.77 5.77 0 0 0-3.548-1.214C2.587 13.854 0 16.418 0 19.57c0 1.949.99 3.672 2.497 4.703q-.095.68-.095 1.372c0 3.94 2.311 7.606 6.508 10.32C12.933 38.567 18.258 40 23.903 40s10.969-1.433 14.992-4.035c4.197-2.714 6.509-6.38 6.509-10.32q-.001-.63-.082-1.253C46.931 23.377 48 21.595 48 19.57"
          />
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

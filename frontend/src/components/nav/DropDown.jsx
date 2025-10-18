import { User, Settings, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";



export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const rootRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current || !btnRef.current || !rootRef.current) return;
      if (
        !menuRef.current.contains(e.target) &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Basic keyboard handling
  function onKeyDown(e) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative flex items-center justify-end w-full" onKeyDown={onKeyDown}>
      {/* Avatar button with no background; hover/focus ring tightly around the image */}
      <button
        type="button"
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center justify-center p-0 bg-transparent rounded-full focus:outline-none"
      >
        <img
          src="https://i.pravatar.cc/100?img=13"
          alt="User avatar"
          className="h-10 w-10 rounded-full object-cover ring-0 transition-shadow duration-150 group-hover:ring-2 group-hover:ring-gray-300 group-focus-visible:ring-2 group-focus-visible:ring-gray-400 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-white"
        />
      </button>

      <div
          ref={menuRef}
          id="profile-menu"
          role="menu"
          aria-label="Profile menu"
          aria-hidden={!open}
          className={`absolute right-0 top-[48px] z-50 w-64 rounded-xl border bg-white p-2 shadow-lg transform transition duration-150 origin-top-right ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <img
              src="https://i.pravatar.cc/100?img=13"
              alt="User avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="grid">
              <span className="text-sm font-medium leading-tight">Oskar Olofsson</span>
              <span className="text-xs text-gray-500">oskar@example.com</span>
            </div>
          </div>
          <div className="my-1 h-px bg-gray-200" />

          <a href="#/profile" role="menuitem" tabIndex={open ? 0 : -1} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-50">
            <User className="h-4 w-4" />
            My Profile
          </a>
          <a href="#/settings" role="menuitem" tabIndex={open ? 0 : -1} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-50">
            <Settings className="h-4 w-4" />
            Settings
          </a>
          <a href="#/sign-out" role="menuitem" tabIndex={open ? 0 : -1} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-50">
            <LogOut className="h-4 w-4" />
            Sign out
          </a>
        </div>
    </div>
  );
}

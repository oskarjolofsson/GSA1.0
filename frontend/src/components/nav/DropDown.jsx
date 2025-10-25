import { User, Settings, Clock, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from '../../auth/authContext';

export default function ProfileDropdown() {
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const rootRef = useRef(null);
    const { user, logout } = useAuth();

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

    if (!user) return null;

    return (
        <div ref={rootRef} className="relative flex items-center justify-end w-full pr-4" onKeyDown={onKeyDown}>
            <button
                type="button"
                ref={btnRef}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="profile-menu"
                onClick={() => setOpen((v) => !v)}
                className="group inline-flex items-center justify-center p-0 bg-transparent rounded-full focus:outline-none"
            >
                <ProfileIcon url={user.photoURL} />
            </button>

            <div
                ref={menuRef}
                id="profile-menu"
                role="menu"
                aria-label="Profile menu"
                aria-hidden={!open}
                className={`absolute right-0 top-[48px] z-50 w-64 rounded-xl border border-slate-700 
              bg-slate-900 text-blue-300 
              p-2 shadow-lg transform transition duration-150 origin-top-right 
              ${open ? 'scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                <div className="flex items-center gap-3 px-2 py-2">
                    <ProfileIcon url={user.photoURL} />
                    <div className="grid">
                        <span className="text-sm font-medium leading-tight">{user.displayName}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                </div>
                <div className="my-1 h-px bg-gray-200" />

                <MenuItem name="My Profile" href="/profile" icon={<User className="h-4 w-4" />} />
                <MenuItem name="Past Drills" href="/past-drills" icon={<Clock className="h-4 w-4" />} />
                {/* <MenuItem name="Sign Out" onClick={logout} icon={<LogOut className="h-4 w-4" />} /> */}
            </div>
        </div>
    );
}

function ProfileIcon({ url }) {
    return (
        <span className="p-1 rounded-full bg-gray-700 bg-opacity-30" aria-hidden="true">
            {url ? (
                <img
                    src={url}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full object-cover"
                />
            ) : (
                <User className="w-6 h-6 text-gray-100" />
            )}
        </span>
    );
}


function MenuItem({ name, href, icon, onClick }) {
    return (
        <a href={href} role="menuitem" tabIndex={0} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-50 opacity-90 hover:opacity-100 transition" onClick={onClick}>
            {icon}
            {name}
        </a>
    );
}

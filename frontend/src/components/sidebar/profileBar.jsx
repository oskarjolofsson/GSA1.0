import { User, Settings, Clock, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from '../../auth/authContext';

export default function ProfileBar() {
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
        <div ref={rootRef} className="relative w-full" onKeyDown={onKeyDown}>
            <button
                type="button"
                ref={btnRef}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="profile-menu"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-700 hover:bg-opacity-40 w-full"
            >
                <div className="flex-shrink-0">
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="User avatar"
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="p-1 rounded-full bg-gray-700 bg-opacity-30">
                            <User className="w-8 h-8 text-gray-100" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-white">{user.displayName}</span>
                </div>
            </button>

            <div
                ref={menuRef}
                id="profile-menu"
                role="menu"
                aria-label="Profile menu"
                aria-hidden={!open}
                className={`absolute bottom-full left-0 z-50 w-full rounded-lg border border-slate-700 
              bg-slate-900 text-blue-300 
              p-2 shadow-lg transform transition duration-150 origin-bottom-left mb-2
              ${open ? 'scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                <MenuItem name="My Profile" href="/profile" icon={<User className="h-4 w-4" />} />
                {/* <MenuItem name="Settings" href="/settings" icon={<Settings className="h-4 w-4" />} /> */}
                {/* <MenuItem name="Past Drills" href="/past-drills" icon={<Clock className="h-4 w-4" />} /> */}
                <div className="my-1 h-px bg-gray-700" />
                <MenuItem name="Sign Out" onClick={logout} icon={<LogOut className="h-4 w-4" />} />
            </div>
        </div>
    );
}

function MenuItem({ name, href, icon, onClick }) {
    return (
        <a
            href={href}
            role="menuitem"
            tabIndex={0}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 hover:bg-opacity-40 transition-colors duration-200 text-sm font-medium text-white"
            onClick={onClick}
        >
            {icon}
            {name}
        </a>
    );
}
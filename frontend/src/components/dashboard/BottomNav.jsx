import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Upload", icon: "↑" },
  { to: "/dashboard/analysis", label: "History", icon: "📊" },
  { to: "/dashboard/feedback", label: "Drills", icon: "🎯" },
  { to: "/dashboard/account", label: "Account", icon: "👤" },
  { to: "/dashboard/help", label: "Help", icon: "❓" },
];

export default function BottomNav() {
  return (
    <nav className="relative z-10 pb-6 flex justify-center">
      <div className="flex items-center gap-1 rounded-full bg-[#0e1428]/80 backdrop-blur-md border border-white/10 px-2 py-2 shadow-xl">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition
              ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-white/60 hover:text-white"
              }
            `
            }
          >
            <span>{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

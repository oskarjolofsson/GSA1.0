import { NavLink } from "react-router-dom";
import {
  ArrowUpNarrowWide,
  ChartLine,
  BookMarked,
  User,
  FileQuestionMark,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Upload", icon: <ArrowUpNarrowWide size={18} /> },
  { to: "/dashboard/drills", label: "Drills", icon: <ChartLine size={18} /> },
  { to: "/dashboard/analyse", label: "Analysis", icon: <BookMarked size={18} /> },
  { to: "/dashboard/account", label: "Account", icon: <User size={18} /> },
  { to: "/dashboard/help", label: "Help", icon: <FileQuestionMark size={18} /> },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 bg-[#0b1020]/90 text-white px-2 py-2 rounded-full shadow-xl backdrop-blur-md">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `
              group relative flex items-center gap-2
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 ease-out
              will-change-transform
              ${
                isActive
                  ? "bg-blue-500 text-white shadow-lg scale-105"
                  : "text-white/70 hover:text-white hover:scale-105 hover:shadow-lg"
              }
            `
            }
          >
            <span className="flex items-center">{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

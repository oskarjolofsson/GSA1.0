import { NavLink } from "react-router-dom";
import {
  Upload,
  ChartLine,
  Home
} from "lucide-react";

const items = [
  { to: "/dashboard/app", label: "Home", icon: <Home size={18} /> },
  { to: "/dashboard/upload", label: "Upload", icon: <Upload size={18} /> },
  { to: "/dashboard/drills", label: "Drills", icon: <ChartLine size={18} /> },
];

export default function SidebarNav({ isOpen }) {
  return (
    <div className={`w-full px-2 ${isOpen ? 'flex-row' : 'flex-col items-center'}`}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `
            flex items-center gap-3 rounded-lg transition-colors duration-200 border-b px-3 py-2 mb-2 border-white/10
            ${isOpen ? 'px-3 py-2 flex-1 justify-center sm:justify-start' : 'px-4 py-2'}
            ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-white/70 hover:text-white hover:bg-gray-700 hover:bg-opacity-40"
            }
          `
          }
        >
          <span className="flex items-center flex-shrink-0">{item.icon}</span>
          {isOpen && <span className="text-sm font-medium hidden sm:inline">{item.label}</span>}
        </NavLink>
      ))}
    </div>
  );
}

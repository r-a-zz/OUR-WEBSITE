import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Music, FileText, Edit3, Info, Mail } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "services", label: "Chill & Fun", icon: Music, path: "/services" },
  { id: "planner", label: "My Planner", icon: FileText, path: "/planner" },
  { id: "diary", label: "Diary", icon: Edit3, path: "/diary" },
  { id: "about", label: "About", icon: Info, path: "/about" },
  { id: "contact", label: "Contact", icon: Mail, path: "/contact" },
];

export default function Sidebar({ onSelect }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="p-6">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">Navigation</h2>
      </div>
      <nav className="space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (typeof onSelect === "function") {
                  onSelect(item.id);
                } else {
                  navigate(item.path);
                }
              }}
              className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-white/20 text-blue-400"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <Icon size={22} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

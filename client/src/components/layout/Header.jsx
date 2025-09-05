import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

export default function Header({ onToggleSidebar, onNewEntry }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeSection =
    location.pathname === "/" ? "home" : location.pathname.replace("/", "");
  return (
    <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-white p-3 hover:bg-white/10 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="text-white font-semibold text-lg">Modern Website</div>
        </div>

        {activeSection === "diary" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                typeof onNewEntry === "function"
                  ? onNewEntry()
                  : navigate("/diary?open=new")
              }
              className="hidden md:inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow"
            >
              + New Entry
            </button>
            <button
              onClick={() =>
                typeof onNewEntry === "function"
                  ? onNewEntry()
                  : navigate("/diary?open=new")
              }
              className="md:hidden p-2 bg-white/5 rounded-lg"
            >
              +
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

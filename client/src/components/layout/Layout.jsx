import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

function BackgroundEffects() {
  return <div className="absolute inset-0" aria-hidden />;
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <BackgroundEffects />

      <div
        className={`fixed top-0 left-0 h-full bg-white/10 backdrop-blur-lg border-r border-white/20 transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <Sidebar
          active={null}
          onSelect={(id) => {
            const path = `/${id === "home" ? "" : id}`;
            navigate(path);
            setSidebarOpen(false);
          }}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-72" : "ml-0"
        }`}
      >
        <Header
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          activeSection={null}
          onNewEntry={() => {
            navigate("/diary?open=new");
            setSidebarOpen(false);
          }}
        />
        <main className="p-6 lg:p-12 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

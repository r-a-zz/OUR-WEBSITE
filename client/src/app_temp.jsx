import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Layout from "./components/layout/Layout";
import Home from "./components/pages/Home";
import Services from "./components/pages/Services";
import Diary from "./components/pages/Diary";
import Planner from "./components/pages/Planner";
import About from "./components/pages/About";
import Contact from "./components/pages/Contact";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [diaryOpenRequest, setDiaryOpenRequest] = useState(0);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const headerNewEntry = () => {
    setActiveSection("diary");
    setDiaryOpenRequest(Date.now());
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <Home />;
      case "services":
        return <Services />;
      case "diary":
        return (
          <Diary
            openRequest={diaryOpenRequest}
            clearOpenRequest={() => setDiaryOpenRequest(0)}
          />
        );
      case "planner":
        return <Planner />;
      case "about":
        return <About />;
      case "contact":
        return <Contact />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* simple background placeholder (visuals live elsewhere) */}
      <div className="absolute inset-0" aria-hidden />

      <div
        className={`fixed top-0 left-0 h-full bg-white/10 backdrop-blur-lg border-r border-white/20 transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <Sidebar
          active={activeSection}
          onSelect={(id) => {
            setActiveSection(id);
            setSidebarOpen(false);
          }}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Layout
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onNewEntry={headerNewEntry}
      >
        {renderContent()}
      </Layout>
    </div>
  );
}

// src/App.jsx
// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import MusicCard from "./components/ui/MusicCard";
import {
  Menu,
  X,
  Home,
  Info,
  Layers,
  Briefcase,
  FileText,
  Mail,
  Music,
  BookOpen,
  Edit3,
} from "lucide-react";

/* Diary component with modal editor starts here */
function Diary({ openRequest, clearOpenRequest }) {
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(null); // { id, content, date }
  const [isNew, setIsNew] = useState(false); // whether modal is for a new note
  const textareaRef = useRef(null);

  // load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("diary_notes");
      if (raw) setNotes(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load diary notes", e);
    }

    // no localStorage auto-open behavior; opening is controlled by openRequest prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // respond to header open requests (when Diary already mounted)
  useEffect(() => {
    if (!openRequest) return;
    const newNote = {
      id: Date.now(),
      subject: "",
      content: "",
      date: new Date().toISOString(),
    };
    setModalNote(newNote);
    setIsNew(true);
    setModalOpen(true);
    // call clearOpenRequest if provided so the signal is consumed
    if (typeof clearOpenRequest === "function") {
      try {
        clearOpenRequest();
      } catch (e) {
        // ignore
      }
    }
  }, [openRequest]);

  // persist to localStorage on any change
  useEffect(() => {
    try {
      localStorage.setItem("diary_notes", JSON.stringify(notes));
    } catch (e) {
      console.error("Failed to save diary notes", e);
    }
  }, [notes]);

  // focus textarea when modal opens
  useEffect(() => {
    if (modalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [modalOpen]);

  // keyboard ESC to close modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && modalOpen) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, modalNote]);

  const openNew = () => {
    const newNote = {
      id: Date.now(),
      subject: "",
      content: "",
      date: new Date().toISOString(),
    };
    setModalNote(newNote);
    setIsNew(true);
    setModalOpen(true);
  };

  const openEdit = (note) => {
    setModalNote({ ...note }); // clone (note may contain subject)
    setIsNew(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!modalNote) return;
    const updated = { ...modalNote, date: new Date().toISOString() };

    if (isNew) {
      // add to front (newest first)
      setNotes((prev) => [updated, ...prev]);
    } else {
      // update and move to front
      setNotes((prev) => {
        const others = prev.filter((n) => n.id !== updated.id);
        return [updated, ...others];
      });
    }
    setModalOpen(false);
    setModalNote(null);
    setIsNew(false);
  };

  const handleDelete = () => {
    if (!modalNote) return;
    if (!confirm("Delete this diary entry?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== modalNote.id));
    setModalOpen(false);
    setModalNote(null);
    setIsNew(false);
  };

  const handleCancel = () => {
    // if it's a new unsaved note, just close and discard
    setModalOpen(false);
    setModalNote(null);
    setIsNew(false);
  };

  const updateModalContent = (val) => {
    setModalNote((m) => (m ? { ...m, content: val } : m));
  };

  const updateModalField = (field, val) => {
    setModalNote((m) => (m ? { ...m, [field]: val } : m));
  };

  const fmt = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-center">
        <h1 className="text-4xl font-bold text-white text-center">Diary</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.length === 0 && (
          <div className="col-span-full flex items-center justify-center min-h-[40vh]">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-white/80 text-center max-w-xl">
              No entries yet. Click{" "}
              <span className="font-semibold text-white">New Chapter</span> to
              start your diary.
            </div>
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 transition-all duration-200 relative cursor-pointer hover:scale-[1.01]"
            onClick={() => openEdit(note)}
          >
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="text-xs text-white/70">{fmt(note.date)}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!confirm("Delete this diary entry?")) return;
                    setNotes((prev) => prev.filter((n) => n.id !== note.id));
                  }}
                  className="text-sm text-red-400 px-2 py-1 rounded hover:bg-white/5 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="text-white/80 whitespace-pre-wrap min-h-[120px]">
              {note.content.trim() === "" ? (
                <div className="italic text-white/60">
                  No text — click to add thoughts.
                </div>
              ) : note.content.length > 400 ? (
                note.content.slice(0, 400) + "…"
              ) : (
                note.content
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          ></div>

          {/* modal panel */}
          <div className="relative z-10 w-full max-w-2xl mx-4">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {isNew ? "New Diary Entry" : "Edit Diary Entry"}
                  </div>
                  <div className="text-xs text-white/70">
                    {modalNote ? fmt(modalNote.date) : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isNew && (
                    <button
                      onClick={handleDelete}
                      className="text-sm text-red-400 px-3 py-1 rounded hover:bg-white/5 transition"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={handleCancel}
                    className="text-sm text-white/80 px-3 py-1 rounded hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow hover:scale-[1.02] transition"
                  >
                    Save
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={modalNote?.subject ?? ""}
                onChange={(e) => updateModalField("subject", e.target.value)}
                placeholder="Subject (optional)"
                className="w-full mb-3 bg-transparent outline-none text-white placeholder-white/50 p-2 rounded border border-white/10"
              />

              <textarea
                ref={textareaRef}
                value={modalNote?.content ?? ""}
                onChange={(e) => updateModalContent(e.target.value)}
                placeholder="Write your feelings, thoughts or a memory... (press Save when done)"
                rows={12}
                className="w-full bg-transparent resize-none outline-none text-white placeholder-white/50 p-2 rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* Diary component ends here */

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  // signal to request opening the diary modal from header
  const [diaryOpenRequest, setDiaryOpenRequest] = useState(0);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Header "New Entry" -> sets a flag and navigates to diary; Diary detects flag on mount and opens.
  const headerNewEntry = () => {
    // request diary view and signal Diary to open the modal (in-memory only)
    setActiveSection("diary");
    setDiaryOpenRequest(Date.now());
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "services", label: "Chill & Fun", icon: Music },
    { id: "planner", label: "My Planner", icon: FileText },
    { id: "diary", label: "Diary", icon: Edit3 },
    { id: "about", label: "About", icon: Info },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                Welcome to Our
                <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Amazing Website
                </span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Experience the future of web design with stunning visuals and
                seamless interactions
              </p>
              <button className="mt-8 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg">
                Get Started
              </button>
            </div>
          </div>
        );
      // In client/src/App.jsx, inside the renderContent function:

      case "services":
        return (
          <div className="space-y-8">
            <h1
              className="text-5xl font-bold text-white mb-8"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              At your Service ma'am !
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* The MusicCard is self-contained and manages its own state */}
              <MusicCard />

              {/* This is a simple, static card that will NOT expand */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  UI/UX Design
                </h3>
                <p className="text-white/80">
                  Beautiful and intuitive user interfaces that enhance user
                  experience.
                </p>
              </div>

              {/* These other cards are also static */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Mobile Apps
                </h3>
                <p className="text-white/80">
                  Native and cross-platform mobile applications for iOS and
                  Android.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Consulting
                </h3>
                <p className="text-white/80">
                  Strategic technology consulting to help your business grow and succeed.
                </p>
              </div>
            </div>
          </div>
        );
      case "diary":
        // render the interactive diary component (modal editor)
        return (
          <Diary
            openRequest={diaryOpenRequest}
            clearOpenRequest={() => setDiaryOpenRequest(0)}
          />
        );
      case "planner":
        return (
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-white mb-8">My Plans</h1>
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                >
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Plan{item}
                  </h3>
                  <p className="text-white/70 mb-4">
                    Published on January{item + 10}, 2024
                  </p>
                  <p className="text-white/80 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua. Ut enim ad minim veniam, quis nostrud
                    exercitation...
                  </p>
                  <button className="mt-4 text-blue-400 hover:text-blue-300 font-semibold">
                    Read More →
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case "about":
        return (
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-white mb-8">About Us</h1>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <p className="text-lg text-white/90 leading-relaxed mb-6">
                We are a passionate team dedicated to creating exceptional
                digital experiences. Our mission is to push the boundaries of
                what's possible on the web.
              </p>
              <p className="text-lg text-white/90 leading-relaxed">
                With years of experience in modern web development, we craft
                solutions that are not only beautiful but also functional and
                user-friendly.
              </p>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-white mb-8">Contact Us</h1>
            <div className="max-w-2xl">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/90 mb-2 font-semibold">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2 font-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2 font-semibold">
                      Message
                    </label>
                    <textarea
                      rows="4"
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Impressive background styling */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 left-20 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>
        <div className="absolute bottom-0 right-20 w-80 h-80 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-3000"></div>

        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/10 backdrop-blur-lg border-r border-white/20 transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <h2
              className={`text-2xl font-bold text-white transition-opacity duration-300 ${
                sidebarOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              Navigation
            </h2>
            <button
              onClick={toggleSidebar}
              className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                  className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                    activeSection === item.id
                      ? "bg-white/20 text-blue-400 border border-blue-400/30 shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <IconComponent size={22} />
                  <span
                    className={`transition-opacity duration-300 font-medium ${
                      sidebarOpen ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-72" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="text-white hover:text-blue-400 transition-colors p-3 hover:bg-white/10 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <div className="text-white font-semibold text-lg">
                Modern Website
              </div>
            </div>

            {/* NEW ENTRY button placed in the top bar - show only on Diary */}
            {activeSection === "diary" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={headerNewEntry}
                  className="hidden md:inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow hover:scale-[1.02] transition"
                >
                  + New Entry
                </button>

                {/* small icon shown on very small screens */}
                <button
                  onClick={headerNewEntry}
                  className="md:hidden p-2 bg-white/5 rounded-lg"
                  title="New Entry"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-12 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-6xl">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useEffect } from "react";
import Modal from "../ui/Modal";
import useDiary from "../../hooks/useDiary";
import { fmt } from "../../utils/dateHelpers";
import { useLocation, useNavigate } from "react-router-dom";

export default function DiaryPage({ openRequest, clearOpenRequest }) {
  const {
    notes,
    modalOpen,
    modalNote,
    isNew,
    textareaRef,
    openNew,
    openEdit,
    save,
    remove,
    setModalNote,
    setModalOpen,
  } = useDiary(openRequest, clearOpenRequest);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("open") === "new") {
      openNew();
      // remove query param so it doesn't auto-open again
      params.delete("open");
      const base =
        location.pathname + (params.toString() ? `?${params.toString()}` : "");
      navigate(base, { replace: true });
    }
  }, [location.search]);

  const updateField = (field, val) =>
    setModalNote((m) => (m ? { ...m, [field]: val } : m));

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
              <span className="font-semibold text-white">New Entry</span> to
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
                    remove(note.id);
                  }}
                  className="text-sm text-red-400 px-2 py-1 rounded hover:bg-white/5 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            {note.subject && (
              <div className="text-lg font-semibold text-white mb-2">
                {note.subject}
              </div>
            )}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isNew ? "New Diary Entry" : "Edit Diary Entry"}
        footer={
          <div className="flex items-center gap-2 justify-end">
            {!isNew && (
              <button
                onClick={() => {
                  if (!confirm("Delete this diary entry?")) return;
                  remove(modalNote.id);
                  setModalOpen(false);
                }}
                className="text-sm text-red-400 px-3 py-1 rounded hover:bg-white/5 transition"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setModalOpen(false)}
              className="text-sm text-white/80 px-3 py-1 rounded hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => save(modalNote)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow"
            >
              Save
            </button>
          </div>
        }
      >
        <input
          type="text"
          value={modalNote?.subject ?? ""}
          onChange={(e) => updateField("subject", e.target.value)}
          placeholder="Subject (optional)"
          className="w-full mb-3 bg-transparent outline-none text-white placeholder-white/50 p-2 rounded border border-white/10"
        />
        <textarea
          ref={textareaRef}
          value={modalNote?.content ?? ""}
          onChange={(e) => updateField("content", e.target.value)}
          placeholder="Write your feelings..."
          rows={12}
          className="w-full bg-transparent resize-none outline-none text-white placeholder-white/50 p-2 rounded"
        />
      </Modal>
    </div>
  );
}

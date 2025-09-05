import { useState, useRef, useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

export default function useDiary(openRequest, clearOpenRequest) {
  const [notes, setNotes] = useLocalStorage('diary_notes', []);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!openRequest) return;
    const newNote = { id: Date.now(), subject: '', content: '', date: new Date().toISOString() };
    setModalNote(newNote);
    setIsNew(true);
    setModalOpen(true);
    if (typeof clearOpenRequest === 'function') clearOpenRequest();
  }, [openRequest]);

  useEffect(() => {
    if (modalOpen && textareaRef.current) textareaRef.current.focus();
  }, [modalOpen]);

  const openNew = () => {
    const newNote = { id: Date.now(), subject: '', content: '', date: new Date().toISOString() };
    setModalNote(newNote);
    setIsNew(true);
    setModalOpen(true);
  };

  const openEdit = (note) => { setModalNote({ ...note }); setIsNew(false); setModalOpen(true); };

  const save = (note) => {
    const updated = { ...note, date: new Date().toISOString() };
    if (isNew) setNotes((prev) => [updated, ...prev]);
    else setNotes((prev) => [updated, ...prev.filter((n) => n.id !== updated.id)]);
    setModalOpen(false);
    setModalNote(null);
    setIsNew(false);
  };

  const remove = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  return { notes, modalOpen, modalNote, isNew, textareaRef, openNew, openEdit, save, remove, setModalNote, setModalOpen };
}

import { useState } from 'react';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchNotes = async (searchQuery) => {
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const notes = JSON.parse(localStorage.getItem('diary_notes') || '[]');
    const filtered = notes.filter(note => 
      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((note.subject || '') && note.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setResults(filtered);
    setIsSearching(false);
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    searchNotes,
  };
}

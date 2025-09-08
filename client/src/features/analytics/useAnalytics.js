import { useState } from 'react';

export function useAnalytics() {
  const [stats, setStats] = useState({
    totalEntries: 0,
    thisWeek: 0,
    thisMonth: 0,
    averageLength: 0,
    longestStreak: 0,
    currentStreak: 0,
  });

  const calculateStats = (notes) => {
    if (!notes.length) return stats;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = notes.filter(note => new Date(note.date) > weekAgo).length;
    const thisMonth = notes.filter(note => new Date(note.date) > monthAgo).length;
    const averageLength = Math.round(
      notes.reduce((sum, note) => sum + (note.content || '').length, 0) / notes.length
    );

    const sortedNotes = notes.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedNotes.length; i++) {
      const current = new Date(sortedNotes[i].date);
      const previous = i > 0 ? new Date(sortedNotes[i - 1].date) : null;

      if (!previous || (previous.getTime() - current.getTime()) <= 24 * 60 * 60 * 1000) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    setStats({
      totalEntries: notes.length,
      thisWeek,
      thisMonth,
      averageLength,
      longestStreak,
      currentStreak,
    });
  };

  return { stats, calculateStats };
}

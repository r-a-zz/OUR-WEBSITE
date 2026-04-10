import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  motion as Motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  Heart,
  Plus,
  Calendar,
  Book,
  Pen,
  Search,
  Star,
  X,
  Save,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Flame,
  Trophy,
  Sparkles,
  RefreshCw,
  Circle,
  CheckCircle2,
  ClipboardList,
  Smile,
} from "lucide-react";

const STORAGE_KEYS = {
  entries: "loveNotesEntries",
  checkins: "loveNotesDailyCheckins",
  tasks: "loveNotesDailyTasks",
};

const DAILY_PROMPTS = [
  "What made you smile today, and how can we recreate that moment this week?",
  "Write one tiny thing you are grateful for in our relationship today.",
  "What is one dream we can start planning this month, even in a small way?",
  "If today had a soundtrack, which song would describe us and why?",
  "Describe a memory with me that still makes your heart feel warm.",
  "What is one gentle reminder you want future-us to never forget?",
  "Write a 3-line love note to your future self and to us.",
  "What is one daily habit that would make our life calmer and happier?",
  "What did you overcome today that I should be proud of you for?",
  "Finish this sentence: Today, love looked like...",
];

const DEFAULT_DAILY_TASKS = [
  "Drink enough water",
  "Send one sweet message",
  "Take a 10-minute mindful break",
  "Write one gratitude line",
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toLocalDayKey = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseStorageValue = (rawValue, fallbackValue) => {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
};

const hashString = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const createDefaultTasksForDay = (dayKey) =>
  DEFAULT_DAILY_TASKS.map((title, index) => ({
    id: `${dayKey}-default-${index}`,
    title,
    completed: false,
  }));

const normalizeEntryDayKey = (entryDate) => {
  if (!entryDate) {
    return "";
  }

  return toLocalDayKey(new Date(entryDate));
};

const daysBetweenKeys = (laterKey, earlierKey) => {
  const laterDate = new Date(`${laterKey}T00:00:00`);
  const earlierDate = new Date(`${earlierKey}T00:00:00`);

  return Math.round((laterDate - earlierDate) / DAY_IN_MS);
};

const buildWritingStats = (entries) => {
  const uniqueDayKeys = Array.from(
    new Set(
      entries
        .map((entry) => normalizeEntryDayKey(entry.date))
        .filter((dayKey) => Boolean(dayKey)),
    ),
  ).sort();

  let longestStreak = 0;
  let streakWindow = 0;

  uniqueDayKeys.forEach((dayKey, index) => {
    if (index === 0) {
      streakWindow = 1;
      longestStreak = 1;
      return;
    }

    const dayDiff = daysBetweenKeys(dayKey, uniqueDayKeys[index - 1]);
    streakWindow = dayDiff === 1 ? streakWindow + 1 : 1;
    longestStreak = Math.max(longestStreak, streakWindow);
  });

  let currentStreak = 0;

  if (uniqueDayKeys.length > 0) {
    currentStreak = 1;

    for (let index = uniqueDayKeys.length - 1; index > 0; index -= 1) {
      const dayDiff = daysBetweenKeys(
        uniqueDayKeys[index],
        uniqueDayKeys[index - 1],
      );

      if (dayDiff !== 1) {
        break;
      }

      currentStreak += 1;
    }

    const lastEntryDay = uniqueDayKeys[uniqueDayKeys.length - 1];
    const gapFromToday = daysBetweenKeys(toLocalDayKey(), lastEntryDay);

    if (gapFromToday > 1) {
      currentStreak = 0;
    }
  }

  return {
    totalNotes: entries.length,
    activeDays: uniqueDayKeys.length,
    currentStreak,
    longestStreak,
  };
};

const LoveNotesPage = () => {
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [newEntry, setNewEntry] = useState({
    subject: "",
    content: "",
    mood: "happy",
    isPrivate: false,
  });
  const [dailyCheckins, setDailyCheckins] = useState({});
  const [dailyTasks, setDailyTasks] = useState({});
  const [taskInput, setTaskInput] = useState("");
  const [checkinDraft, setCheckinDraft] = useState({
    mood: "grateful",
    gratitude: "",
  });

  const todayKey = toLocalDayKey();

  // Memoized static moods to avoid recreating arrays on every render
  const moods = useMemo(
    () => [
      {
        id: "happy",
        emoji: "😊",
        color: "from-yellow-400 to-orange-500",
        label: "Happy",
      },
      {
        id: "love",
        emoji: "😍",
        color: "from-red-400 to-pink-500",
        label: "In Love",
      },
      {
        id: "excited",
        emoji: "🤩",
        color: "from-purple-400 to-indigo-500",
        label: "Excited",
      },
      {
        id: "peaceful",
        emoji: "😌",
        color: "from-green-400 to-blue-500",
        label: "Peaceful",
      },
      {
        id: "nostalgic",
        emoji: "🥺",
        color: "from-blue-400 to-purple-500",
        label: "Nostalgic",
      },
      {
        id: "grateful",
        emoji: "🙏",
        color: "from-pink-400 to-red-500",
        label: "Grateful",
      },
    ],
    [],
  );

  const todayLabel = useMemo(() => {
    if (!todayKey) {
      return "Today";
    }

    return new Date(`${todayKey}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [todayKey]);

  const todaysPrompt = useMemo(() => {
    if (DAILY_PROMPTS.length === 0) {
      return "Write one beautiful thing you noticed today.";
    }

    const promptIndex = hashString(`${todayKey}-prompt`) % DAILY_PROMPTS.length;
    return DAILY_PROMPTS[promptIndex];
  }, [todayKey]);

  // Respect user preference for reduced motion (also helps perf)
  const shouldReduceMotion = useReducedMotion();

  // Choose counts for decorative animations based on device capability
  const { starCount, heartCount } = useMemo(() => {
    const cores =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    if (shouldReduceMotion) return { starCount: 12, heartCount: 6 };
    if (cores < 4) return { starCount: 20, heartCount: 8 };
    return { starCount: 50, heartCount: 12 };
  }, [shouldReduceMotion]);

  // Load local persisted state once on mount.
  useEffect(() => {
    try {
      const savedEntries = parseStorageValue(
        localStorage.getItem(STORAGE_KEYS.entries),
        [],
      );
      if (Array.isArray(savedEntries)) {
        setDiaryEntries(savedEntries);
      }

      const savedCheckins = parseStorageValue(
        localStorage.getItem(STORAGE_KEYS.checkins),
        {},
      );
      if (savedCheckins && typeof savedCheckins === "object") {
        setDailyCheckins(savedCheckins);

        const todayCheckin = savedCheckins[todayKey];
        if (todayCheckin) {
          setCheckinDraft({
            mood: todayCheckin.mood || "grateful",
            gratitude: todayCheckin.gratitude || "",
          });
        }
      }

      const savedTasks = parseStorageValue(
        localStorage.getItem(STORAGE_KEYS.tasks),
        {},
      );
      if (savedTasks && typeof savedTasks === "object") {
        setDailyTasks(savedTasks);
      }
    } catch {
      setDiaryEntries([]);
      setDailyCheckins({});
      setDailyTasks({});
    }
  }, [todayKey]);

  // Save diary entries whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(diaryEntries));
    } catch {
      // Ignore write failures (private mode/quota exceeded).
    }
  }, [diaryEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.checkins,
        JSON.stringify(dailyCheckins),
      );
    } catch {
      // Ignore write failures (private mode/quota exceeded).
    }
  }, [dailyCheckins]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(dailyTasks));
    } catch {
      // Ignore write failures (private mode/quota exceeded).
    }
  }, [dailyTasks]);

  // Ensure each day has a default checklist.
  useEffect(() => {
    setDailyTasks((previous) => {
      if (Array.isArray(previous[todayKey]) && previous[todayKey].length > 0) {
        return previous;
      }

      return {
        ...previous,
        [todayKey]: createDefaultTasksForDay(todayKey),
      };
    });
  }, [todayKey]);

  const openNewEntryModal = () => {
    setEditingEntry(null);
    setNewEntry({
      subject: "",
      content: "",
      mood: checkinDraft.mood || "happy",
      isPrivate: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setNewEntry({
      subject: entry.subject,
      content: entry.content,
      mood: entry.mood,
      isPrivate: entry.isPrivate,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setNewEntry({
      subject: "",
      content: "",
      mood: checkinDraft.mood || "happy",
      isPrivate: false,
    });
  };

  const saveEntry = () => {
    if (!newEntry.subject.trim() || !newEntry.content.trim()) {
      alert("Please fill in both subject and content fields.");
      return;
    }

    const entryData = {
      id: editingEntry ? editingEntry.id : Date.now(),
      subject: newEntry.subject.trim(),
      content: newEntry.content.trim(),
      mood: newEntry.mood,
      isPrivate: newEntry.isPrivate,
      date: editingEntry ? editingEntry.date : new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    if (editingEntry) {
      setDiaryEntries((prev) =>
        prev.map((entry) => (entry.id === editingEntry.id ? entryData : entry)),
      );
    } else {
      setDiaryEntries((prev) => [entryData, ...prev]);
    }

    closeModal();
  };

  const deleteEntry = (entryId) => {
    if (window.confirm("Are you sure you want to delete this love note?")) {
      setDiaryEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    }
  };

  const getMoodConfig = useCallback(
    (moodId) => moods.find((mood) => mood.id === moodId) || moods[0],
    [moods],
  );

  const writingStats = useMemo(
    () => buildWritingStats(diaryEntries),
    [diaryEntries],
  );

  const topMood = useMemo(() => {
    if (diaryEntries.length === 0) {
      return null;
    }

    const moodCounts = diaryEntries.reduce((accumulator, entry) => {
      const moodId = entry.mood || "happy";
      accumulator[moodId] = (accumulator[moodId] || 0) + 1;
      return accumulator;
    }, {});

    const [topMoodId] = Object.entries(moodCounts).sort(
      (first, second) => second[1] - first[1],
    )[0] || [null];

    return topMoodId ? getMoodConfig(topMoodId) : null;
  }, [diaryEntries, getMoodConfig]);

  const memoryOfTheDay = useMemo(() => {
    if (diaryEntries.length === 0) {
      return null;
    }

    const sortedEntries = [...diaryEntries].sort(
      (first, second) =>
        new Date(first.date).getTime() - new Date(second.date).getTime(),
    );
    const memoryIndex =
      hashString(`${todayKey}-memory`) % Math.max(sortedEntries.length, 1);

    return sortedEntries[memoryIndex] || null;
  }, [diaryEntries, todayKey]);

  const todaysCheckin = dailyCheckins[todayKey] || null;

  const todaysTasks = useMemo(
    () => (Array.isArray(dailyTasks[todayKey]) ? dailyTasks[todayKey] : []),
    [dailyTasks, todayKey],
  );

  const completedTaskCount = useMemo(
    () => todaysTasks.filter((task) => task.completed).length,
    [todaysTasks],
  );

  const taskCompletionPercent =
    todaysTasks.length === 0
      ? 0
      : Math.round((completedTaskCount / todaysTasks.length) * 100);

  const openPromptDraft = () => {
    setEditingEntry(null);
    setNewEntry({
      subject: `Prompt for ${todayLabel}`,
      content: `${todaysPrompt}\n\n`,
      mood: checkinDraft.mood || "happy",
      isPrivate: false,
    });
    setIsModalOpen(true);
  };

  const openMemoryOfTheDay = () => {
    if (!memoryOfTheDay) {
      return;
    }

    openEditModal(memoryOfTheDay);
  };

  const saveTodayCheckin = () => {
    if (!checkinDraft.gratitude.trim()) {
      alert("Write one gratitude line before saving today's check-in.");
      return;
    }

    const payload = {
      mood: checkinDraft.mood,
      gratitude: checkinDraft.gratitude.trim(),
      updatedAt: new Date().toISOString(),
    };

    setDailyCheckins((previous) => ({
      ...previous,
      [todayKey]: payload,
    }));
  };

  const addTodayTask = () => {
    const title = taskInput.trim();
    if (!title) {
      return;
    }

    setDailyTasks((previous) => {
      const existingTasks = Array.isArray(previous[todayKey])
        ? previous[todayKey]
        : createDefaultTasksForDay(todayKey);

      return {
        ...previous,
        [todayKey]: [
          ...existingTasks,
          {
            id: `${todayKey}-task-${Date.now()}`,
            title,
            completed: false,
          },
        ],
      };
    });

    setTaskInput("");
  };

  const toggleTodayTask = (taskId) => {
    setDailyTasks((previous) => {
      const existingTasks = Array.isArray(previous[todayKey])
        ? previous[todayKey]
        : createDefaultTasksForDay(todayKey);

      return {
        ...previous,
        [todayKey]: existingTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      };
    });
  };

  const removeTodayTask = (taskId) => {
    setDailyTasks((previous) => {
      const existingTasks = Array.isArray(previous[todayKey])
        ? previous[todayKey]
        : createDefaultTasksForDay(todayKey);

      return {
        ...previous,
        [todayKey]: existingTasks.filter((task) => task.id !== taskId),
      };
    });
  };

  const resetTodayChecklist = () => {
    setDailyTasks((previous) => ({
      ...previous,
      [todayKey]: createDefaultTasksForDay(todayKey),
    }));
  };

  // Memoized Entry card to prevent unnecessary re-renders
  const EntryCard = React.memo(function EntryCard({
    entry,
    index,
    onEdit,
    onDelete,
  }) {
    const moodConfig = getMoodConfig(entry.mood);
    const hoverProps = shouldReduceMotion
      ? {}
      : { whileHover: { y: -8, scale: 1.02 }, whileTap: { scale: 0.99 } };

    return (
      <Motion.div
        key={entry.id}
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: (index % 6) * 0.06, duration: 0.45 }}
        {...hoverProps}
        className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 hover:bg-gray-800/60 hover:border-rose-400/50 transition-all duration-300 group cursor-pointer shadow-2xl hover:shadow-purple-500/20"
      >
        {/* Entry Header */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${moodConfig.color} text-white text-sm font-medium`}
          >
            <span>{moodConfig.emoji}</span>
            <span>{moodConfig.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {entry.isPrivate && (
              <Lock className="text-purple-400/80" size={18} />
            )}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => onEdit(entry)}
                className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/40 transition-colors duration-300 shadow-md border border-purple-400/30"
              >
                <Edit className="text-purple-300" size={16} />
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors duration-300 shadow-md border border-red-400/30"
              >
                <Trash2 className="text-red-300" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Entry Content */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-100 text-xl leading-tight line-clamp-2 font-serif">
            {entry.subject}
          </h3>
          <p className="text-gray-300 text-base leading-relaxed line-clamp-4">
            {entry.content}
          </p>
        </div>

        {/* Entry Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-500/20">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
            <Calendar size={14} />
            <span>{new Date(entry.date).toLocaleDateString()}</span>
          </div>
          <div>
            <Star className="text-yellow-400" size={18} />
          </div>
        </div>
      </Motion.div>
    );
  });

  const handleEdit = (entry) => openEditModal(entry);
  const handleDelete = (id) => deleteEntry(id);

  const filteredEntries = useMemo(
    () =>
      diaryEntries.filter((entry) => {
        const matchesSearch =
          entry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMood = filterMood === "all" || entry.mood === filterMood;

        return matchesSearch && matchesMood;
      }),
    [diaryEntries, searchTerm, filterMood],
  );

  return (
    <div
      className="min-h-screen space-y-12 relative"
      style={{
        background:
          "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 75%, #000000 100%)",
      }}
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Dark Gradient Orbs */}
        <div className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-600/8 to-purple-600/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-r from-rose-600/6 to-violet-600/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Twinkling Stars - reduced count and reduced-motion aware */}
        {Array.from({ length: starCount }).map((_, i) => {
          const left = `${(i * 37) % 100}%`;
          const top = `${(i * 73) % 100}%`;
          if (shouldReduceMotion) {
            return (
              <div
                key={`star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{ left, top }}
              />
            );
          }

          return (
            <Motion.div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{ left, top, willChange: "opacity, transform" }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1, 0.6] }}
              transition={{
                duration: 2 + (i % 3) * 0.6,
                repeat: Infinity,
                delay: (i % 5) * 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Floating Hearts Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: heartCount }).map((_, i) => {
          const left = `${(i * 29) % 100}%`;
          const top = `${(i * 47) % 100}%`;
          if (shouldReduceMotion) {
            return (
              <div
                key={`heart-${i}`}
                className="absolute text-rose-400/20"
                style={{ left, top }}
              >
                <Heart size={10} />
              </div>
            );
          }

          return (
            <Motion.div
              key={`heart-${i}`}
              className="absolute text-rose-400/20"
              style={{ left, top, willChange: "transform, opacity" }}
              animate={{
                y: [0, -40, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.3, 1],
                opacity: [0.12, 0.28, 0.12],
              }}
              transition={{
                duration: 6 + (i % 3) * 1.2,
                repeat: Infinity,
                delay: (i % 4) * 0.6,
              }}
            >
              <Heart size={8 + (i % 3) * 4} />
            </Motion.div>
          );
        })}
      </div>

      {/* Header */}
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center relative z-10 pt-8"
      >
        <Motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <Heart
            className="text-rose-500 mx-auto mb-6 drop-shadow-2xl"
            size={80}
          />
          <div className="absolute inset-0 text-rose-400/40 blur-sm">
            <Heart className="mx-auto mb-6" size={80} />
          </div>
          <div className="absolute inset-0 text-purple-400/20 blur-lg">
            <Heart className="mx-auto mb-6" size={80} />
          </div>
        </Motion.div>

        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 font-serif drop-shadow-2xl">
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Love Notes
          </span>
        </h1>
        <div className="relative">
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg">
            Our secret digital sanctuary for love, dreams, and whispered
            thoughts
          </p>
          <Motion.span
            className="text-3xl ml-2"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 0.5,
            }}
          >
            ✨
          </Motion.span>
        </div>
      </Motion.div>

      {/* Daily Companion Dashboard */}
      <Motion.section
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        <div className="xl:col-span-2 bg-gray-900/55 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs sm:text-sm">
                <Sparkles size={14} />
                Daily Ritual
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                One beautiful thing, every day
              </h2>
              <p className="text-sm sm:text-base text-gray-300">{todayLabel}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openPromptDraft}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white font-semibold hover:brightness-110 transition-all duration-300 border border-purple-300/30"
              >
                Use Today's Prompt
              </button>
              <button
                onClick={openMemoryOfTheDay}
                disabled={!memoryOfTheDay}
                className="px-5 py-3 rounded-xl bg-gray-800/70 text-gray-100 font-semibold border border-gray-600/40 hover:bg-gray-700/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Memory of the Day
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-purple-400/30 bg-gradient-to-r from-purple-900/30 via-rose-900/20 to-indigo-900/20 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-purple-200/80 mb-2">
              Today's writing prompt
            </p>
            <p className="text-lg text-gray-100 leading-relaxed">
              {todaysPrompt}
            </p>
          </div>

          {memoryOfTheDay && (
            <div className="mt-4 rounded-2xl border border-pink-400/25 bg-pink-900/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-pink-200/80 mb-1">
                Memory resurfaced
              </p>
              <p className="text-base text-pink-100 font-semibold line-clamp-1">
                {memoryOfTheDay.subject}
              </p>
              <p className="text-sm text-pink-200/80 mt-1 line-clamp-2">
                {memoryOfTheDay.content}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-orange-400/25 bg-orange-900/15 p-4">
              <div className="flex items-center gap-2 text-orange-300 text-sm">
                <Flame size={16} />
                Current Streak
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                {writingStats.currentStreak}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/25 bg-yellow-900/15 p-4">
              <div className="flex items-center gap-2 text-yellow-300 text-sm">
                <Trophy size={16} />
                Best Streak
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                {writingStats.longestStreak}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-400/25 bg-purple-900/15 p-4">
              <div className="flex items-center gap-2 text-purple-300 text-sm">
                <Book size={16} />
                Total Notes
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                {writingStats.totalNotes}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-400/25 bg-sky-900/15 p-4">
              <div className="flex items-center gap-2 text-sky-300 text-sm">
                <Calendar size={16} />
                Active Days
              </div>
              <p className="text-2xl font-bold text-white mt-2">
                {writingStats.activeDays}
              </p>
            </div>
          </div>

          {topMood && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-400/30 bg-pink-900/15 text-pink-200 text-sm">
              <span>Most written mood:</span>
              <span>{topMood.emoji}</span>
              <span className="font-semibold">{topMood.label}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-900/55 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-6 shadow-2xl">
          <div className="flex items-center gap-2 text-gray-100 mb-2">
            <Smile size={18} className="text-pink-300" />
            <h3 className="text-xl font-bold">Daily Check-in</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Save your mood and one gratitude line. It takes less than a minute.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {moods.map((mood) => (
              <button
                key={`checkin-${mood.id}`}
                onClick={() =>
                  setCheckinDraft((previous) => ({
                    ...previous,
                    mood: mood.id,
                  }))
                }
                className={`px-2 py-2 rounded-xl border text-xs sm:text-sm transition-all duration-300 flex flex-col items-center gap-1 ${
                  checkinDraft.mood === mood.id
                    ? "bg-purple-600/70 border-purple-300/50 text-white"
                    : "bg-gray-800/60 border-gray-600/40 text-gray-300 hover:bg-gray-700/60"
                }`}
              >
                <span>{mood.emoji}</span>
                <span className="leading-tight">{mood.label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={checkinDraft.gratitude}
            onChange={(event) =>
              setCheckinDraft((previous) => ({
                ...previous,
                gratitude: event.target.value,
              }))
            }
            placeholder="One thing I am grateful for today..."
            rows={4}
            className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-purple-500/30 bg-gray-800/40 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-pink-400/60"
          />

          <button
            onClick={saveTodayCheckin}
            className="mt-4 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white font-semibold hover:brightness-110 transition-all duration-300"
          >
            Save Today's Check-in
          </button>

          {todaysCheckin && (
            <p className="mt-3 text-xs text-emerald-300/90">
              Saved today
              {todaysCheckin.updatedAt
                ? ` at ${new Date(todaysCheckin.updatedAt).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}`
                : ""}
              .
            </p>
          )}
        </div>
      </Motion.section>

      {/* New Entry Button */}
      <Motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center relative z-10"
      >
        <Motion.button
          whileHover={{
            scale: 1.05,
            y: -5,
            boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={openNewEntryModal}
          className="bg-gradient-to-r from-purple-600 via-rose-600 to-pink-600 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-rose-500/25 transition-all duration-300 flex items-center gap-4 mx-auto border border-purple-400/30 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl"></div>
          <Plus size={28} className="relative z-10" />
          <span className="font-serif relative z-10">Write New Love Note</span>
          <Motion.span
            className="relative z-10"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            💕
          </Motion.span>
        </Motion.button>
      </Motion.div>

      {/* Daily Checklist */}
      <Motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        className="relative z-10 bg-gray-900/55 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-100">
              <ClipboardList size={18} className="text-cyan-300" />
              <h3 className="text-2xl font-bold">Daily Life Checklist</h3>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Keep a gentle routine and make every day feel intentional.
            </p>
          </div>

          <button
            onClick={resetTodayChecklist}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-500/40 bg-gray-800/60 text-gray-200 hover:bg-gray-700/70 transition-all duration-300"
          >
            <RefreshCw size={15} />
            Reset Today
          </button>
        </div>

        <div className="mt-5">
          <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden border border-purple-500/20">
            <Motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskCompletionPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
            />
          </div>
          <p className="text-sm text-gray-300 mt-2">
            {completedTaskCount}/{todaysTasks.length} completed (
            {taskCompletionPercent}%)
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {todaysTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-gray-900/40 px-4 py-3"
            >
              <button
                onClick={() => toggleTodayTask(task.id)}
                className="text-purple-300 hover:text-pink-300 transition-colors duration-300"
                aria-label={
                  task.completed ? "Mark task incomplete" : "Mark task complete"
                }
              >
                {task.completed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={18} />
                )}
              </button>

              <p
                className={`flex-1 ${
                  task.completed
                    ? "text-gray-500 line-through"
                    : "text-gray-200"
                }`}
              >
                {task.title}
              </p>

              <button
                onClick={() => removeTodayTask(task.id)}
                className="text-gray-400 hover:text-rose-300 transition-colors duration-300"
                aria-label="Remove task"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addTodayTask();
              }
            }}
            placeholder="Add a tiny daily task..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-purple-500/30 bg-gray-800/40 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-pink-400/60"
          />
          <button
            onClick={addTodayTask}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:brightness-110 transition-all duration-300"
          >
            Add Task
          </button>
        </div>
      </Motion.section>

      {/* Search and Filter */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400/80"
            size={20}
          />
          <input
            type="text"
            placeholder="Search your love notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border-2 border-purple-500/30 rounded-2xl text-gray-200 placeholder-gray-400 focus:outline-none focus:border-rose-400/60 focus:bg-gray-800/60 transition-all duration-300 backdrop-blur-md font-medium shadow-xl"
          />
        </div>

        {/* Mood Filter */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilterMood("all")}
            className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 border-2 shadow-lg backdrop-blur-sm ${
              filterMood === "all"
                ? "bg-purple-600/80 text-white border-purple-400/60 shadow-purple-500/25"
                : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border-gray-600/40 hover:border-purple-400/40"
            }`}
          >
            All Notes ✨
          </button>
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setFilterMood(mood.id)}
              className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border-2 shadow-lg backdrop-blur-sm ${
                filterMood === mood.id
                  ? "bg-purple-600/80 text-white border-purple-400/60 shadow-purple-500/25"
                  : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 border-gray-600/40 hover:border-purple-400/40"
              }`}
            >
              <span className="text-lg">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </Motion.div>

      {/* Diary Entries */}
      <Motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="relative z-10"
      >
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20">
            <Motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Book
                className="text-purple-400/60 mx-auto mb-6 drop-shadow-2xl"
                size={80}
              />
            </Motion.div>
            <h3 className="text-3xl font-bold text-gray-200 mb-6 font-serif drop-shadow-lg">
              {diaryEntries.length === 0
                ? "Begin Your Love Story"
                : "No Notes Found"}
            </h3>
            <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-md mx-auto">
              {diaryEntries.length === 0
                ? "Write your first love note and begin documenting your beautiful journey in the stars."
                : "Try adjusting your search or filter to find your love notes."}
            </p>
            {diaryEntries.length === 0 && (
              <button
                onClick={openNewEntryModal}
                className="bg-gradient-to-r from-purple-600 to-rose-600 text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform duration-300 shadow-xl border border-purple-400/30"
              >
                Write First Note 💖
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry, index) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Motion.div>

      {/* Modal for New/Edit Entry */}
      <AnimatePresence>
        {isModalOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,60,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Motion.div
              initial={{ scale: 0.7, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.6,
              }}
              className="relative w-full max-w-3xl max-h-[80vh] overflow-hidden"
            >
              {/* Magical Background Effects */}
              <div className="absolute inset-0 rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-gray-900/90 to-indigo-900/30 rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-900/20 via-transparent to-purple-900/20 rounded-3xl"></div>
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                <div
                  className="absolute -bottom-4 -right-4 w-32 h-32 bg-rose-500/15 rounded-full blur-xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"
                  style={{ animationDelay: "2s" }}
                ></div>
              </div>

              {/* Modal Content */}
              <div className="relative z-10 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
                {/* Scrollable Content */}
                <div className="overflow-y-auto p-8 md:p-12 flex-1">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-purple-500/20">
                    <Motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-4"
                    >
                      <div className="relative">
                        <Pen
                          className="text-rose-400 drop-shadow-lg"
                          size={36}
                        />
                        <div className="absolute inset-0 text-purple-400/40 blur-sm">
                          <Pen size={36} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text font-serif">
                          {editingEntry ? "Edit Love Note" : "New Love Note"}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          Pour your heart out into the cosmos ✨
                        </p>
                      </div>
                    </Motion.div>

                    <Motion.button
                      initial={{ scale: 0, rotate: 90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeModal}
                      className="relative p-3 rounded-2xl bg-gradient-to-br from-gray-800/60 to-gray-700/60 hover:from-gray-700/60 hover:to-gray-600/60 transition-all duration-300 shadow-lg border border-gray-600/40 group"
                    >
                      <X
                        className="text-gray-300 group-hover:text-white transition-colors"
                        size={24}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                    </Motion.button>
                  </div>

                  {/* Form */}
                  <Motion.div
                    className="space-y-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {/* Subject Field */}
                    <div className="space-y-3">
                      <label className="text-gray-200 font-bold text-lg flex items-center gap-2">
                        <span className="text-rose-400">✍️</span>
                        Subject
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newEntry.subject}
                          onChange={(e) =>
                            setNewEntry((prev) => ({
                              ...prev,
                              subject: e.target.value,
                            }))
                          }
                          placeholder="What's on your heart today? 💭"
                          className="w-full px-6 py-4 border-2 border-purple-500/30 bg-gray-800/40 rounded-2xl focus:outline-none focus:border-rose-400/60 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-200 font-medium placeholder-gray-400 backdrop-blur-sm shadow-inner"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-rose-500/5 rounded-2xl pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Mood Selection */}
                    <div className="space-y-4">
                      <label className="text-gray-200 font-bold text-lg flex items-center gap-2">
                        <span className="text-yellow-400">🌙</span>
                        How are you feeling?
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {moods.map((mood) => (
                          <Motion.button
                            key={mood.id}
                            type="button"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              setNewEntry((prev) => ({
                                ...prev,
                                mood: mood.id,
                              }))
                            }
                            className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 backdrop-blur-sm ${
                              newEntry.mood === mood.id
                                ? "border-rose-400/60 bg-gradient-to-br from-purple-500/20 to-rose-500/20 shadow-lg shadow-purple-500/20"
                                : "border-gray-600/40 bg-gray-800/30 hover:border-purple-400/40 hover:bg-gray-700/40"
                            }`}
                          >
                            <span className="text-3xl filter drop-shadow-lg">
                              {mood.emoji}
                            </span>
                            <span className="text-sm font-semibold text-gray-300">
                              {mood.label}
                            </span>
                            {newEntry.mood === mood.id && (
                              <Motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-rose-400/10 rounded-2xl"
                              />
                            )}
                          </Motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Content Field */}
                    <div className="space-y-3">
                      <label className="text-gray-200 font-bold text-lg flex items-center gap-2">
                        <span className="text-purple-400">📝</span>
                        Your Love Note
                      </label>
                      <div className="relative">
                        <textarea
                          value={newEntry.content}
                          onChange={(e) =>
                            setNewEntry((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Pour your heart out here... Share your thoughts, feelings, dreams, and precious moments together. Let the stars witness your love story unfold... ✨"
                          rows={8}
                          className="w-full px-6 py-4 border-2 border-purple-500/30 bg-gray-800/40 rounded-2xl focus:outline-none focus:border-rose-400/60 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 resize-none text-gray-200 leading-relaxed placeholder-gray-400 backdrop-blur-sm shadow-inner"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-rose-500/5 rounded-2xl pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Privacy Toggle */}
                    <Motion.div
                      className="flex items-center gap-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setNewEntry((prev) => ({
                            ...prev,
                            isPrivate: !prev.isPrivate,
                          }))
                        }
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 border-2 backdrop-blur-sm ${
                          newEntry.isPrivate
                            ? "bg-gradient-to-r from-gray-700/60 to-gray-600/60 text-gray-200 border-gray-500/40 shadow-lg"
                            : "bg-gradient-to-r from-purple-600/20 to-rose-600/20 text-purple-200 border-purple-400/40 shadow-lg shadow-purple-500/20"
                        }`}
                      >
                        <Motion.div
                          animate={{ rotate: newEntry.isPrivate ? 0 : 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          {newEntry.isPrivate ? (
                            <Lock size={20} />
                          ) : (
                            <Unlock size={20} />
                          )}
                        </Motion.div>
                        <span className="font-semibold">
                          {newEntry.isPrivate
                            ? "Private Note 🔒"
                            : "Shared Memory ✨"}
                        </span>
                      </button>
                    </Motion.div>
                  </Motion.div>
                </div>

                {/* Sticky Action Buttons Footer */}
                <div className="sticky bottom-0 bg-gradient-to-t from-gray-900/95 via-gray-900/90 to-transparent backdrop-blur-xl border-t border-purple-500/20 p-6">
                  <Motion.div
                    className="flex gap-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={closeModal}
                      className="flex-1 px-8 py-4 border-2 border-gray-600/50 bg-gray-800/40 text-gray-300 rounded-2xl hover:bg-gray-700/40 hover:border-gray-500/60 transition-all duration-300 font-semibold backdrop-blur-sm"
                    >
                      Cancel
                    </Motion.button>
                    <Motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 20px 40px -12px rgba(236, 72, 153, 0.4)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveEntry}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 via-rose-600 to-pink-600 text-white rounded-2xl hover:from-purple-500 hover:via-rose-500 hover:to-pink-500 transition-all duration-300 font-bold flex items-center justify-center gap-3 shadow-xl border border-purple-400/30 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-xl"></div>
                      <Save size={20} className="relative z-10" />
                      <span className="relative z-10">
                        {editingEntry ? "Update Note ✨" : "Save Note 💫"}
                      </span>
                    </Motion.button>
                  </Motion.div>
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoveNotesPage;

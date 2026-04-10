import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ExternalLink,
  ShoppingBag,
  Search,
  Sparkles,
  ClipboardList,
  Link2,
  Clock3,
  Brain,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const FLASK_AI_URL = (import.meta.env.VITE_FLASK_AI_URL || "").trim();

const STORAGE_KEYS = {
  tasks: "dailyHubTasksV1",
  shoppingBoard: "dailyHubShoppingBoardV1",
};

const DAILY_THOUGHTS = [
  "A small loving routine repeated daily becomes a lifetime memory.",
  "The best days are not perfect days, they are intentional days.",
  "Take one deep breath before reacting. Calm is a superpower.",
  "Choose progress over pressure. Tiny steps still count.",
  "Love grows in ordinary moments done with extraordinary care.",
  "A kind message at the right time can change the whole day.",
  "Less rush, more presence. Your attention is your real gift.",
  "Protect your energy like it is the most expensive thing you own.",
  "Joy is easier to find when gratitude is written down.",
  "Plan less perfectly, execute more consistently.",
  "What you do daily matters more than what you do occasionally.",
  "Good days are built from tiny promises kept to yourself.",
];

const QUICK_LINKS = [
  {
    id: "pinterest",
    label: "Pinterest",
    helper: "Outfit, decor, and moodboard ideas",
    url: "https://www.pinterest.com/",
  },
  {
    id: "calendar",
    label: "Google Calendar",
    helper: "Schedule your week quickly",
    url: "https://calendar.google.com/",
  },
  {
    id: "maps",
    label: "Google Maps",
    helper: "Date spots, cafes, and saved places",
    url: "https://maps.google.com/",
  },
  {
    id: "keep",
    label: "Google Keep",
    helper: "Capture random ideas instantly",
    url: "https://keep.google.com/",
  },
];

const MARKETPLACES = [
  {
    id: "amazon",
    name: "Amazon",
    buildUrl: (query) =>
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
  },
  {
    id: "flipkart",
    name: "Flipkart",
    buildUrl: (query) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "myntra",
    name: "Myntra",
    buildUrl: (query) => `https://www.myntra.com/${encodeURIComponent(query)}`,
  },
  {
    id: "ajio",
    name: "Ajio",
    buildUrl: (query) =>
      `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`,
  },
  {
    id: "meesho",
    name: "Meesho",
    buildUrl: (query) =>
      `https://www.meesho.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "nykaa",
    name: "Nykaa",
    buildUrl: (query) =>
      `https://www.nykaa.com/search/result/?q=${encodeURIComponent(query)}`,
  },
];

const PRIORITY_META = {
  low: { label: "Low", color: "text-emerald-300" },
  normal: { label: "Normal", color: "text-cyan-300" },
  high: { label: "High", color: "text-rose-300" },
};

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

const parseJson = (raw, fallback) => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const hashText = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const parsePrice = (value) => {
  if (!value) {
    return null;
  }

  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
};

const formatPrice = (value) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const buildCalendarCells = (monthDate, tasksByDay, todayKey) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    let date;
    let isCurrentMonth = true;

    if (index < firstDay) {
      const day = daysInPreviousMonth - firstDay + index + 1;
      date = new Date(year, month - 1, day);
      isCurrentMonth = false;
    } else if (index < firstDay + daysInMonth) {
      const day = index - firstDay + 1;
      date = new Date(year, month, day);
    } else {
      const day = index - (firstDay + daysInMonth) + 1;
      date = new Date(year, month + 1, day);
      isCurrentMonth = false;
    }

    const dayKey = toLocalDayKey(date);
    const dayStats = tasksByDay[dayKey] || { total: 0, open: 0 };

    cells.push({
      key: `${dayKey}-${index}`,
      day: date.getDate(),
      dayKey,
      isCurrentMonth,
      isToday: dayKey === todayKey,
      totalTasks: dayStats.total,
      openTasks: dayStats.open,
    });
  }

  return cells;
};

const createInitialShoppingRows = (query) =>
  MARKETPLACES.map((marketplace) => ({
    id: marketplace.id,
    marketplace: marketplace.name,
    url: marketplace.buildUrl(query),
    observedPrice: "",
    checkedAt: "",
  }));

const DailyHubPage = () => {
  const { setActiveSection } = useApp();
  const todayKey = toLocalDayKey();
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(todayKey);
  const [taskPriority, setTaskPriority] = useState("normal");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const [productQuery, setProductQuery] = useState("");
  const [shoppingBoard, setShoppingBoard] = useState({ query: "", rows: [] });
  const [isComparing, setIsComparing] = useState(false);
  const [flaskInsight, setFlaskInsight] = useState("");
  const [isLoadingFlaskInsight, setIsLoadingFlaskInsight] = useState(false);

  useEffect(() => {
    const storedTasks = parseJson(localStorage.getItem(STORAGE_KEYS.tasks), []);
    if (Array.isArray(storedTasks)) {
      setTasks(storedTasks);
    }

    const storedBoard = parseJson(
      localStorage.getItem(STORAGE_KEYS.shoppingBoard),
      { query: "", rows: [] },
    );

    if (
      storedBoard &&
      typeof storedBoard === "object" &&
      Array.isArray(storedBoard.rows)
    ) {
      setShoppingBoard(storedBoard);
      setProductQuery(storedBoard.query || "");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
    } catch {
      // Ignore write failures.
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.shoppingBoard,
        JSON.stringify(shoppingBoard),
      );
    } catch {
      // Ignore write failures.
    }
  }, [shoppingBoard]);

  const thoughtOfTheDay = useMemo(() => {
    const thoughtIndex =
      hashText(`${todayKey}-daily-thought`) % DAILY_THOUGHTS.length;
    return DAILY_THOUGHTS[thoughtIndex];
  }, [todayKey]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((first, second) => {
      if (first.completed !== second.completed) {
        return first.completed ? 1 : -1;
      }

      if (first.dueDate !== second.dueDate) {
        return first.dueDate.localeCompare(second.dueDate);
      }

      return first.createdAt - second.createdAt;
    });
  }, [tasks]);

  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.length - completed;

    const dueToday = tasks.filter(
      (task) => !task.completed && task.dueDate === todayKey,
    ).length;

    return {
      total: tasks.length,
      completed,
      pending,
      dueToday,
    };
  }, [tasks, todayKey]);

  const tasksByDay = useMemo(() => {
    return tasks.reduce((accumulator, task) => {
      if (!task.dueDate) {
        return accumulator;
      }

      if (!accumulator[task.dueDate]) {
        accumulator[task.dueDate] = { total: 0, open: 0 };
      }

      accumulator[task.dueDate].total += 1;
      if (!task.completed) {
        accumulator[task.dueDate].open += 1;
      }

      return accumulator;
    }, {});
  }, [tasks]);

  const calendarCells = useMemo(
    () => buildCalendarCells(calendarMonth, tasksByDay, todayKey),
    [calendarMonth, tasksByDay, todayKey],
  );

  const monthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [calendarMonth]);

  const addTask = useCallback(() => {
    const normalizedTitle = taskTitle.trim();

    if (!normalizedTitle) {
      return;
    }

    const dueDate = taskDate || todayKey;

    setTasks((previous) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: normalizedTitle,
        dueDate,
        priority: taskPriority,
        completed: false,
        createdAt: Date.now(),
      },
      ...previous,
    ]);

    setTaskTitle("");
    setTaskDate(dueDate);
    setTaskPriority("normal");
  }, [taskDate, taskPriority, taskTitle, todayKey]);

  const toggleTask = useCallback((taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }, []);

  const removeTask = useCallback((taskId) => {
    setTasks((previous) => previous.filter((task) => task.id !== taskId));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((previous) => previous.filter((task) => !task.completed));
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCalendarMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }, []);

  const goToNextMonth = useCallback(() => {
    setCalendarMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }, []);

  const compareProduct = useCallback(() => {
    const normalizedQuery = productQuery.trim();

    if (!normalizedQuery) {
      return;
    }

    setIsComparing(true);
    setFlaskInsight("");

    const nextRows = createInitialShoppingRows(normalizedQuery);
    setShoppingBoard({ query: normalizedQuery, rows: nextRows });

    window.setTimeout(() => {
      setIsComparing(false);
    }, 220);
  }, [productQuery]);

  const askFlaskInsight = useCallback(async () => {
    if (!shoppingBoard.query) {
      setFlaskInsight(
        "Run a comparison first, then ask Flask AI for suggestions.",
      );
      return;
    }

    if (!FLASK_AI_URL) {
      setFlaskInsight(
        "Flask AI is optional. Add VITE_FLASK_AI_URL in client .env to enable live AI shopping advice.",
      );
      return;
    }

    const endpoint = FLASK_AI_URL.replace(/\/$/, "");
    const offers = shoppingBoard.rows.map((row) => ({
      marketplace: row.marketplace,
      price: parsePrice(row.observedPrice),
      checkedAt: row.checkedAt || null,
    }));

    setIsLoadingFlaskInsight(true);

    try {
      const response = await fetch(`${endpoint}/api/shopping-advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: shoppingBoard.query,
          offers,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Flask AI request failed with status ${response.status}`,
        );
      }

      const payload = await response.json();
      const adviceText =
        payload?.advice ||
        payload?.tip ||
        payload?.message ||
        "No advice returned by Flask AI.";

      setFlaskInsight(String(adviceText));
    } catch {
      setFlaskInsight(
        "Could not reach Flask AI right now. Please check the URL or CORS settings, then try again.",
      );
    } finally {
      setIsLoadingFlaskInsight(false);
    }
  }, [shoppingBoard]);

  const updateObservedPrice = useCallback((marketplaceId, value) => {
    setShoppingBoard((previous) => ({
      ...previous,
      rows: previous.rows.map((row) =>
        row.id === marketplaceId
          ? {
              ...row,
              observedPrice: value,
              checkedAt: new Date().toISOString(),
            }
          : row,
      ),
    }));
  }, []);

  const cheapestDeal = useMemo(() => {
    const pricedRows = shoppingBoard.rows
      .map((row) => ({ ...row, numericPrice: parsePrice(row.observedPrice) }))
      .filter((row) => row.numericPrice !== null)
      .sort((first, second) => first.numericPrice - second.numericPrice);

    if (pricedRows.length === 0) {
      return null;
    }

    return pricedRows[0];
  }, [shoppingBoard.rows]);

  const aiShoppingHint = useMemo(() => {
    const pricedRows = shoppingBoard.rows
      .map((row) => ({ ...row, numericPrice: parsePrice(row.observedPrice) }))
      .filter((row) => row.numericPrice !== null);

    if (pricedRows.length === 0) {
      return "Add a few observed prices and I will highlight the best deal for today.";
    }

    if (pricedRows.length === 1) {
      return "Nice start. Add prices from at least one more website to compare savings.";
    }

    const sorted = [...pricedRows].sort(
      (first, second) => first.numericPrice - second.numericPrice,
    );
    const best = sorted[0];
    const secondBest = sorted[1];

    const difference = secondBest.numericPrice - best.numericPrice;

    if (difference >= 500) {
      return `${best.marketplace} looks like a strong win today, about ${formatPrice(
        difference,
      )} cheaper than the next option.`;
    }

    if (difference >= 150) {
      return `${best.marketplace} is currently the cheapest. Check delivery date before placing the order.`;
    }

    return "Prices are very close. Choose the seller with better delivery and return policy.";
  }, [shoppingBoard.rows]);

  return (
    <div className="space-y-10 sm:space-y-12">
      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
          Daily Hub
        </h1>
        <p className="mt-4 text-white/80 max-w-3xl mx-auto text-base sm:text-lg">
          One place for your everyday flow: plan tasks, track dates, compare
          product prices fast, and keep the day intentional.
        </p>
      </Motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6 }}
          className="lg:col-span-2 rounded-3xl border border-yellow-400/25 bg-gradient-to-br from-yellow-900/15 via-orange-900/10 to-transparent p-6"
        >
          <div className="flex items-center gap-2 text-yellow-200 mb-3">
            <Lightbulb size={18} />
            <span className="text-sm uppercase tracking-[0.14em]">
              Thought For Today
            </span>
          </div>
          <p className="text-xl sm:text-2xl text-white leading-relaxed font-medium">
            "{thoughtOfTheDay}"
          </p>
          <p className="text-xs text-white/50 mt-3">
            Updates automatically every day.
          </p>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.6 }}
          className="rounded-3xl border border-cyan-400/25 bg-cyan-900/10 p-6"
        >
          <div className="flex items-center gap-2 text-cyan-200 mb-4">
            <Link2 size={18} />
            <h2 className="text-lg font-semibold">Quick Daily Links</h2>
          </div>

          <div className="space-y-3">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-cyan-500/20 bg-black/25 hover:bg-cyan-500/10 transition-colors duration-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">
                      {link.label}
                    </p>
                    <p className="text-xs text-cyan-100/60 mt-0.5">
                      {link.helper}
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-cyan-300" />
                </div>
              </a>
            ))}
          </div>
        </Motion.section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="xl:col-span-2 rounded-3xl border border-purple-500/25 bg-gray-900/45 backdrop-blur-md p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-200">
                <ClipboardList size={18} />
                <h2 className="text-2xl font-bold text-white">Todo Planner</h2>
              </div>
              <p className="text-sm text-white/60 mt-1">
                Keep it simple. Add what matters and finish with calm focus.
              </p>
            </div>

            <button
              type="button"
              onClick={clearCompleted}
              className="px-3 py-2 rounded-lg text-sm border border-gray-500/40 text-gray-200 hover:bg-gray-800/70 transition-colors duration-200"
            >
              Clear Completed
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6">
            <input
              type="text"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
              placeholder="Add a task for today..."
              className="md:col-span-6 px-4 py-3 rounded-xl bg-gray-800/60 border border-purple-500/30 text-white placeholder-white/40 focus:outline-none focus:border-purple-300"
            />

            <input
              type="date"
              value={taskDate}
              onChange={(event) => setTaskDate(event.target.value)}
              className="md:col-span-3 px-4 py-3 rounded-xl bg-gray-800/60 border border-purple-500/30 text-white focus:outline-none focus:border-purple-300"
            />

            <select
              value={taskPriority}
              onChange={(event) => setTaskPriority(event.target.value)}
              className="md:col-span-2 px-3 py-3 rounded-xl bg-gray-800/60 border border-purple-500/30 text-white focus:outline-none focus:border-purple-300"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>

            <button
              type="button"
              onClick={addTask}
              className="md:col-span-1 px-3 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:brightness-110 transition-all duration-200 flex items-center justify-center"
              aria-label="Add task"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-900/10 p-3">
              <p className="text-xs text-cyan-200/80">Total</p>
              <p className="text-xl font-bold text-white">{taskStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-3">
              <p className="text-xs text-emerald-200/80">Completed</p>
              <p className="text-xl font-bold text-white">
                {taskStats.completed}
              </p>
            </div>
            <div className="rounded-xl border border-orange-500/20 bg-orange-900/10 p-3">
              <p className="text-xs text-orange-200/80">Pending</p>
              <p className="text-xl font-bold text-white">
                {taskStats.pending}
              </p>
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-pink-900/10 p-3">
              <p className="text-xs text-pink-200/80">Due Today</p>
              <p className="text-xl font-bold text-white">
                {taskStats.dueToday}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 max-h-[26rem] overflow-y-auto pr-1">
            {sortedTasks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
                No tasks yet. Add a tiny task and build momentum.
              </div>
            ) : (
              sortedTasks.map((task) => {
                const priority =
                  PRIORITY_META[task.priority] || PRIORITY_META.normal;
                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-purple-500/20 bg-black/30 p-4 flex items-start gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="text-purple-300 hover:text-cyan-300 transition-colors duration-200 mt-0.5"
                      aria-label={
                        task.completed
                          ? "Mark task incomplete"
                          : "Mark task complete"
                      }
                    >
                      {task.completed ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          task.completed
                            ? "text-white/45 line-through"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 text-white/60">
                          <Clock3 size={13} />
                          {new Date(
                            `${task.dueDate}T00:00:00`,
                          ).toLocaleDateString()}
                        </span>
                        <span className={priority.color}>
                          {priority.label} priority
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="text-white/50 hover:text-rose-300 transition-colors duration-200"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Motion.section>

        <Motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6 }}
          className="rounded-3xl border border-blue-500/25 bg-blue-900/10 p-6"
        >
          <div className="flex items-center gap-2 text-blue-200">
            <CalendarDays size={18} />
            <h2 className="text-xl font-semibold text-white">Calendar</h2>
          </div>

          <div className="flex items-center justify-between mt-4 mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg border border-blue-500/30 text-blue-100 hover:bg-blue-500/15"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <p className="text-sm font-semibold text-white">{monthLabel}</p>

            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-lg border border-blue-500/30 text-blue-100 hover:bg-blue-500/15"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-blue-100/70 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => (
              <div
                key={cell.key}
                className={`min-h-[3.15rem] rounded-lg border p-1.5 ${
                  cell.isCurrentMonth
                    ? "border-blue-500/20 bg-black/25"
                    : "border-white/5 bg-white/5"
                } ${cell.isToday ? "ring-1 ring-pink-400/60" : ""}`}
              >
                <p
                  className={`text-xs ${
                    cell.isCurrentMonth ? "text-white/90" : "text-white/35"
                  }`}
                >
                  {cell.day}
                </p>

                {cell.totalTasks > 0 && (
                  <div className="mt-1 text-[10px]">
                    <p className="text-cyan-200">{cell.totalTasks} task</p>
                    {cell.openTasks > 0 && (
                      <p className="text-orange-200">{cell.openTasks} open</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Motion.aside>
      </div>

      <Motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="rounded-3xl border border-pink-500/25 bg-pink-900/10 p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-pink-200">
              <ShoppingBag size={18} />
              <h2 className="text-2xl font-bold text-white">
                Smart Shopping Compare
              </h2>
            </div>
            <p className="text-sm text-white/65 mt-1 max-w-2xl">
              Enter any product, open top ecommerce links instantly, and log
              observed prices to find the cheapest option. Fast and practical.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("shopping")}
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-100 hover:bg-cyan-500/25 transition-colors duration-200"
            >
              Open full compare page
              <ExternalLink size={12} />
            </button>

            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80">
              <Sparkles size={13} />
              Quick board mode
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-10 relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200/70"
            />
            <input
              type="text"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  compareProduct();
                }
              }}
              placeholder="Example: white sneakers women, skincare gift set, bluetooth earbuds"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/35 border border-pink-500/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-300"
            />
          </div>

          <button
            type="button"
            onClick={compareProduct}
            disabled={isComparing}
            className="md:col-span-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold hover:brightness-110 transition-all duration-200 disabled:opacity-60"
          >
            {isComparing ? "Loading..." : "Compare"}
          </button>
        </div>

        {shoppingBoard.rows.length > 0 ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-white/70">
              Results for{" "}
              <span className="text-white font-semibold">
                {shoppingBoard.query}
              </span>
            </p>

            {shoppingBoard.rows.map((row) => {
              const rowPrice = parsePrice(row.observedPrice);
              const isBestDeal =
                cheapestDeal && rowPrice !== null && row.id === cheapestDeal.id;

              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border p-4 ${
                    isBestDeal
                      ? "border-emerald-400/40 bg-emerald-900/15"
                      : "border-pink-500/20 bg-black/25"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {row.marketplace}
                      </p>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-pink-200/90 hover:text-pink-100 mt-1"
                      >
                        Open search
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.observedPrice}
                        onChange={(event) =>
                          updateObservedPrice(row.id, event.target.value)
                        }
                        placeholder="Price seen"
                        className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-pink-500/30 text-white placeholder-white/40 text-sm"
                      />
                      {isBestDeal && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/35 text-emerald-200">
                          Best deal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-900/12 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-emerald-200/80">
                  Cheapest observed today
                </p>
                <p className="text-lg text-white font-semibold mt-1">
                  {cheapestDeal
                    ? `${cheapestDeal.marketplace} - ${formatPrice(
                        parsePrice(cheapestDeal.observedPrice),
                      )}`
                    : "Add prices to detect best deal"}
                </p>
              </div>

              <div className="rounded-2xl border border-pink-500/25 bg-pink-900/12 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-pink-200/80">
                  Smart hint
                </p>
                <p className="text-sm text-white/90 mt-1">{aiShoppingHint}</p>

                <button
                  type="button"
                  onClick={askFlaskInsight}
                  disabled={isLoadingFlaskInsight}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-400/30 text-pink-100 hover:bg-pink-500/10 transition-colors duration-200 disabled:opacity-60"
                >
                  <Brain size={14} />
                  {isLoadingFlaskInsight
                    ? "Asking Flask AI..."
                    : "Ask Flask AI"}
                </button>

                {flaskInsight && (
                  <p className="text-xs text-pink-100/85 mt-2 leading-relaxed">
                    {flaskInsight}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            Start with a product query to build your price comparison board.
          </div>
        )}
      </Motion.section>
    </div>
  );
};

export default DailyHubPage;

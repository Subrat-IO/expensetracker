"use client";

import { useEffect, useMemo, useState } from "react";
import PwaRegister from "./PwaRegister";

const LOGIN_KEY = "discipline_tracker_logged_in";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const iconMap = {
  home: (
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
  ),
  stats: (
    <path d="M5 18.5h14M7.5 16V9.5M12 16V5.5M16.5 16v-7" />
  ),
  gym: (
    <path d="M6 9.5h2l2-2.5v10L8 14.5H6zm8 0h2l2-2.5v10L16 14.5h-2zm-4 2h4" />
  ),
  profile: (
    <path d="M12 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm-6.5 7a6.5 6.5 0 0 1 13 0" />
  ),
  user: (
    <path d="M12 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm-6.5 7a6.5 6.5 0 0 1 13 0" />
  ),
  lock: (
    <path d="M8 10V8a4 4 0 1 1 8 0v2m-7 0h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
};

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function normalizeApiDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }

  return formatDate(value);
}

function getTodayKey() {
  return formatDate(new Date());
}

function getStartOfWeek(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function currency(value, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

async function fetchJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

function Icon({ name }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
      {iconMap[name]}
    </svg>
  );
}

function StatusPill({ tone, text }) {
  return <div className={`status-pill status-pill-${tone}`}>{text}</div>;
}

function TabButton({ label, tab, activeTab, onPress, icon }) {
  return (
    <button
      type="button"
      className={`nav-item ${activeTab === tab ? "active" : ""}`}
      onClick={() => onPress(tab)}
      aria-current={activeTab === tab ? "page" : undefined}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      onLogin({ remember, user });
    } catch (authError) {
      setError(authError.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="ambient-orb ambient-orb-top" />
      <div className="ambient-orb ambient-orb-bottom" />

      <section className="login-shell">
        <header className="brand-block">
          <span className="eyebrow">Discipline Tracker</span>
          <h1>Control your money. Control your life.</h1>
          <p>
            A focused daily ritual for spending smarter, training consistently,
            and staying in command.
          </p>
        </header>

        <form className="login-card fade-in" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrap">
              <Icon name="user" />
              <input
                id="username"
                type="text"
                inputMode="text"
                autoComplete="username"
                placeholder="Enter username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <Icon name="lock" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember((value) => !value)}
            />
            <span>Remember me</span>
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Checking..." : "Login"}
          </button>

          <p className="credentials-hint">Backend login: admin / 1234</p>
        </form>

        <footer className="login-footer">Stay disciplined daily</footer>
      </section>
    </main>
  );
}

function HomeTab({
  dashboard,
  amount,
  note,
  setAmount,
  setNote,
  addExpense,
  isSyncing,
}) {
  const dailyBudget = Number(dashboard?.dailyBudget || 120);
  const spent = Number(dashboard?.spent || 0);
  const remaining = dailyBudget - spent;
  const expensesToday = dashboard?.expenses || [];
  const tone = spent < dailyBudget ? "success" : spent === dailyBudget ? "warning" : "danger";
  const message =
    spent < dailyBudget
      ? "You are within budget"
      : spent === dailyBudget
        ? "Limit reached"
        : "Overspent today";
  const percentage = Math.min((spent / Math.max(dailyBudget, 1)) * 100, 100);
  const currencyCode = dashboard?.currencyCode || "INR";

  return (
    <section className="tab-panel">
      <div className={`hero-card hero-${tone}`}>
        <div className="hero-header">
          <div>
            <span className="section-label">Today&apos;s Budget</span>
            <h2>{currency(spent, currencyCode)}</h2>
          </div>
          <StatusPill tone={tone} text={message} />
        </div>

        <div className="hero-metrics">
          <div>
            <span>Remaining</span>
            <strong>{currency(Math.abs(remaining), currencyCode)}</strong>
          </div>
          <div>
            <span>Daily cap</span>
            <strong>{currency(dailyBudget, currencyCode)}</strong>
          </div>
        </div>

        <div className="progress-wrap" aria-label="Budget progress">
          <div
            className={`progress-bar progress-${tone}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="panel-card">
        <div className="section-heading">
          <div>
            <span className="section-label">Quick Add</span>
            <h3>Add expense</h3>
          </div>
        </div>

        <form className="expense-form" onSubmit={addExpense}>
          <div className="field-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="e.g. 60"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="note">Note</label>
            <input
              id="note"
              type="text"
              placeholder="Coffee, travel, snack..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="panel-card">
        <div className="section-heading">
          <div>
            <span className="section-label">Today&apos;s Expenses</span>
            <h3>{expensesToday.length} entries</h3>
          </div>
        </div>

        <div className="expense-list">
          {expensesToday.length ? (
            expensesToday.map((expense) => (
              <article
                className="expense-item"
                key={String(expense.id || expense._id)}
              >
                <div>
                  <strong>{expense.note || "Unlabelled expense"}</strong>
                  <span>
                    {new Date(
                      expense.createdAt || `${expense.date}T00:00:00`,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <strong>{currency(expense.amount, currencyCode)}</strong>
              </article>
            ))
          ) : (
            <div className="empty-state">
              No expenses yet today. Keep it intentional.
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="fab-button"
        onClick={addExpense}
        disabled={isSyncing}
      >
        <Icon name="plus" />
        <span>{isSyncing ? "Saving..." : "Add Expense"}</span>
      </button>
    </section>
  );
}

function StatsTab({ statsSummary, weeklySeries, monthlySeries }) {
  const dailyBudget = Number(statsSummary?.dailyBudget || 120);
  const weeklyBudget = Number(statsSummary?.weeklyBudget || dailyBudget * 7);
  const weeklySpent = Number(statsSummary?.weeklySpent || 0);
  const weeklySaved = Number(statsSummary?.weeklySaved || 0);
  const monthlyBudget = Number(statsSummary?.monthlyBudget || 0);
  const monthlySpent = Number(statsSummary?.monthlySpent || 0);
  const monthlySaved = Number(statsSummary?.monthlySaved || 0);
  const currencyCode = statsSummary?.currencyCode || "INR";
  const startOfWeek = getStartOfWeek();
  const highestDay = Math.max(
    ...weeklySeries.map((day) => Number(day.total || 0)),
    dailyBudget,
  );
  const weekDays = [...Array(7)].map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + index);
    const key = formatDate(date);
    const found = weeklySeries.find((item) => item.date === key);

    return {
      key,
      label: DAY_LABELS[date.getDay()],
      total: Number(found?.total || 0),
    };
  });

  return (
    <section className="tab-panel">
      <div className="insight-banner">
        <span className="section-label">This week</span>
        <h2>You saved {currency(weeklySaved, currencyCode)} this week</h2>
        <p>
          Weekly spend is {currency(weeklySpent, currencyCode)} against a planned{" "}
          {currency(weeklyBudget, currencyCode)}.
        </p>
      </div>

      <div className="panel-grid">
        <article className="panel-card metric-card">
          <span>Total spent</span>
          <strong>{currency(weeklySpent, currencyCode)}</strong>
          <small>Weekly budget {currency(weeklyBudget, currencyCode)}</small>
        </article>
        <article className="panel-card metric-card">
          <span>Total saved</span>
          <strong>{currency(weeklySaved, currencyCode)}</strong>
          <small>Monthly saved {currency(monthlySaved, currencyCode)}</small>
        </article>
      </div>

      <div className="panel-card">
        <div className="section-heading">
          <div>
            <span className="section-label">Weekly Graph</span>
            <h3>Spending rhythm</h3>
          </div>
        </div>
        <div className="chart-bars" aria-label="Weekly spend chart">
          {weekDays.map((day) => (
            <div className="chart-day" key={day.key}>
              <div
                className={`chart-bar ${day.total > dailyBudget ? "chart-bar-hot" : ""}`}
                style={{ height: `${Math.max((day.total / highestDay) * 100, 8)}%` }}
              />
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card">
        <div className="section-heading">
          <div>
            <span className="section-label">Weekly vs Monthly</span>
            <h3>Budget comparison</h3>
          </div>
        </div>

        <div className="comparison-row">
          <div>
            <span>Weekly</span>
            <strong>{currency(weeklySpent, currencyCode)}</strong>
          </div>
          <div className="comparison-track">
            <div
              className="comparison-fill comparison-green"
              style={{ width: `${Math.min((weeklySpent / Math.max(weeklyBudget, 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="comparison-row">
          <div>
            <span>Monthly</span>
            <strong>{currency(monthlySpent, currencyCode)}</strong>
          </div>
          <div className="comparison-track">
            <div
              className="comparison-fill comparison-yellow"
              style={{ width: `${Math.min((monthlySpent / Math.max(monthlyBudget, 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <p className="support-copy">
          {monthlySeries.length
            ? `${monthlySeries.length} tracked spending day${monthlySeries.length > 1 ? "s" : ""} this month.`
            : "No monthly spending data yet."}
        </p>
      </div>
    </section>
  );
}

function GymTab({ gymLogMap, toggleGym, gymSummary, isSyncing }) {
  const startOfWeek = getStartOfWeek();
  const weekDates = [...Array(7)].map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + index);
    const key = formatDate(date);

    return {
      key,
      label: DAY_LABELS[date.getDay()],
      completed: !!gymLogMap[key],
      today: key === getTodayKey(),
    };
  });

  let streak = 0;
  const cursor = new Date();

  while (gymLogMap[formatDate(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weeklyConsistency =
    Number(gymSummary?.weeklyConsistency) ||
    Math.round((weekDates.filter((day) => day.completed).length / 7) * 100);

  return (
    <section className="tab-panel">
      <div className="hero-card hero-success gym-card">
        <div className="hero-header">
          <div>
            <span className="section-label">Daily Gym Ritual</span>
            <h2>6-7 AM Gym</h2>
          </div>
          <label className="gym-toggle">
            <input
              type="checkbox"
              checked={!!gymLogMap[getTodayKey()]}
              onChange={() => toggleGym(getTodayKey())}
              disabled={isSyncing}
            />
            <span>{isSyncing ? "Saving..." : "Done today"}</span>
          </label>
        </div>

        <div className="hero-metrics">
          <div>
            <span>Streak count</span>
            <strong>{streak} days</strong>
          </div>
          <div>
            <span>Weekly consistency</span>
            <strong>{weeklyConsistency}%</strong>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="section-heading">
          <div>
            <span className="section-label">Motivation</span>
            <h3>{streak} day streak 🔥</h3>
          </div>
        </div>
        <p className="support-copy">
          Every early session compounds. Protect the habit and the results will
          follow.
        </p>
      </div>

      <div className="panel-card">
        <div className="section-heading">
          <div>
            <span className="section-label">Weekly Calendar</span>
            <h3>Consistency view</h3>
          </div>
        </div>

        <div className="calendar-grid">
          {weekDates.map((day) => (
            <button
              type="button"
              key={day.key}
              className={`calendar-day ${day.completed ? "completed" : ""} ${day.today ? "today" : ""}`}
              onClick={() => toggleGym(day.key)}
              disabled={isSyncing}
            >
              <span>{day.label}</span>
              <strong>{new Date(day.key).getDate()}</strong>
              <em>{day.completed ? "✓" : "○"}</em>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileTab({ statsSummary, gymLogMap, onLogout, gymSummary }) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthPrefix = formatDate(today).slice(0, 7);
  const monthlyBudget = Number(statsSummary?.monthlyBudget || 0);
  const monthlySpent = Number(statsSummary?.monthlySpent || 0);
  const monthlySaved = Number(statsSummary?.monthlySaved || 0);
  const weeklySpent = Number(statsSummary?.weeklySpent || 0);
  const currencyCode = statsSummary?.currencyCode || "INR";
  const gymDays = Object.entries(gymLogMap).filter(
    ([key, complete]) => complete && key.startsWith(monthPrefix),
  ).length;
  const gymScore = Math.min(
    Math.round((gymDays / Math.max(dayOfMonth, 1)) * 100),
    100,
  );
  const moneyScore = Math.max(
    100 - Math.round((monthlySpent / Math.max(monthlyBudget, 1)) * 100),
    0,
  );
  const performanceScore = Math.round((gymScore + moneyScore) / 2);
  const trend = performanceScore >= 70 ? "↑ Improving" : "↓ Needs control";

  return (
    <section className="tab-panel">
      <div className="panel-card profile-hero">
        <span className="section-label">Performance Score</span>
        <h2>{performanceScore}/100</h2>
        <p>{trend}</p>
      </div>

      <div className="panel-grid">
        <article className="panel-card metric-card">
          <span>Weekly summary</span>
          <strong>{currency(weeklySpent, currencyCode)}</strong>
          <small>Budget vs spent vs saved</small>
        </article>
        <article className="panel-card metric-card">
          <span>Monthly saved</span>
          <strong>{currency(monthlySaved, currencyCode)}</strong>
          <small>Adjusted budget {currency(monthlyBudget, currencyCode)}</small>
        </article>
      </div>

      <div className="panel-card">
        <div className="summary-list">
          <div>
            <span>Expense discipline</span>
            <strong>{moneyScore >= 60 ? "Stable control" : "Needs discipline"}</strong>
          </div>
          <div>
            <span>Gym discipline</span>
            <strong>{gymScore >= 60 ? "Strong rhythm" : "Build consistency"}</strong>
          </div>
          <div>
            <span>Trend</span>
            <strong>
              {trend} {gymSummary?.completedDays ? `• ${gymSummary.completedDays} sessions` : ""}
            </strong>
          </div>
        </div>
      </div>

      <button type="button" className="secondary-button" onClick={onLogout}>
        Logout
      </button>
    </section>
  );
}

export default function AppShell() {
  const [booted, setBooted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dashboard, setDashboard] = useState({
    date: getTodayKey(),
    dailyBudget: 120,
    currencyCode: "INR",
    spent: 0,
    remaining: 120,
    expenses: [],
  });
  const [statsSummary, setStatsSummary] = useState({
    dailyBudget: 120,
    weeklyBudget: 840,
    weeklySpent: 0,
    weeklySaved: 840,
    monthlyBudget: 0,
    monthlySpent: 0,
    monthlySaved: 0,
    currencyCode: "INR",
  });
  const [weeklySeries, setWeeklySeries] = useState([]);
  const [monthlySeries, setMonthlySeries] = useState([]);
  const [gymLogs, setGymLogs] = useState([]);
  const [gymSummary, setGymSummary] = useState({
    completedDays: 0,
    weeklyConsistency: 0,
    logs: [],
  });

  const gymLogMap = useMemo(
    () =>
      Object.fromEntries(
        gymLogs.map((log) => [normalizeApiDate(log.date), Boolean(log.completed)]),
      ),
    [gymLogs],
  );

  async function loadAppData() {
    setIsSyncing(true);
    setErrorMessage("");

    try {
      const [
        dashboardPayload,
        statsSummaryPayload,
        weeklySeriesPayload,
        monthlySeriesPayload,
        gymLogsPayload,
        gymSummaryPayload,
      ] = await Promise.all([
        fetchJson("/api/dashboard/today"),
        fetchJson("/api/stats/summary"),
        fetchJson("/api/stats/weekly"),
        fetchJson("/api/stats/monthly"),
        fetchJson("/api/gym"),
        fetchJson("/api/gym/summary"),
      ]);

      setDashboard(dashboardPayload);
      setStatsSummary(statsSummaryPayload);
      setWeeklySeries(weeklySeriesPayload);
      setMonthlySeries(monthlySeriesPayload);
      setGymLogs(gymLogsPayload);
      setGymSummary(gymSummaryPayload);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load live data from backend.");
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    const savedLogin = window.localStorage.getItem(LOGIN_KEY) === "true";
    const timer = window.setTimeout(() => {
      setLoggedIn(savedLogin);
      setBooted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (booted && loggedIn) {
      loadAppData();
    }
  }, [booted, loggedIn]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const greeting = getGreeting(now);
  const displayDate = formatDisplayDate(now);

  function handleLogin() {
    window.localStorage.setItem(LOGIN_KEY, "true");
    setLoggedIn(true);
    setActiveTab("home");
  }

  function handleLogout() {
    window.localStorage.removeItem(LOGIN_KEY);
    setLoggedIn(false);
  }

  async function addExpense(event) {
    if (event) {
      event.preventDefault();
    }

    const numericAmount = Number(amount);
    if (!numericAmount) {
      return;
    }

    setIsSyncing(true);
    setErrorMessage("");

    try {
      await fetchJson("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numericAmount,
          note: note.trim(),
          category: "general",
          date: getTodayKey(),
        }),
      });

      setAmount("");
      setNote("");
      await loadAppData();
    } catch (error) {
      setErrorMessage(error.message || "Failed to save expense.");
      setIsSyncing(false);
    }
  }

  async function toggleGym(dateKey) {
    setIsSyncing(true);
    setErrorMessage("");

    try {
      await fetchJson("/api/gym", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateKey,
          completed: !gymLogMap[dateKey],
          sessionLabel: "6-7 AM Gym",
          notes: "",
        }),
      });

      await loadAppData();
    } catch (error) {
      setErrorMessage(error.message || "Failed to update gym log.");
      setIsSyncing(false);
    }
  }

  if (!booted) {
    return (
      <main className="loading-screen">
        <div className="loader-ring" />
        <p>Preparing your discipline dashboard...</p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <>
        <PwaRegister />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <PwaRegister />
      <main className="app-shell">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="section-label">Daily Discipline</span>
            <h1>
              {greeting}, <br />
              Subrat
            </h1>
            <div className="topbar-date-card" aria-label={`Today is ${displayDate}`}>
              <span className="topbar-date-tag">Today</span>
              <p className="topbar-date">{displayDate}</p>
            </div>
          </div>
          <div className="topbar-badge">
            {currency(
              dashboard?.dailyBudget || statsSummary?.dailyBudget || 120,
              dashboard?.currencyCode || statsSummary?.currencyCode || "INR",
            )}
            /day
          </div>
        </header>

        <section className="content-area">
          {errorMessage ? (
            <div className="form-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {activeTab === "home" ? (
            <HomeTab
              dashboard={dashboard}
              amount={amount}
              note={note}
              setAmount={setAmount}
              setNote={setNote}
              addExpense={addExpense}
              isSyncing={isSyncing}
            />
          ) : null}
          {activeTab === "stats" ? (
            <StatsTab
              statsSummary={statsSummary}
              weeklySeries={weeklySeries}
              monthlySeries={monthlySeries}
            />
          ) : null}
          {activeTab === "gym" ? (
            <GymTab
              gymLogMap={gymLogMap}
              toggleGym={toggleGym}
              gymSummary={gymSummary}
              isSyncing={isSyncing}
            />
          ) : null}
          {activeTab === "profile" ? (
            <ProfileTab
              statsSummary={statsSummary}
              gymLogMap={gymLogMap}
              gymSummary={gymSummary}
              onLogout={handleLogout}
            />
          ) : null}
        </section>

        <nav className="bottom-nav" aria-label="Primary navigation">
          <TabButton
            label="Home"
            tab="home"
            activeTab={activeTab}
            onPress={setActiveTab}
            icon="home"
          />
          <TabButton
            label="Stats"
            tab="stats"
            activeTab={activeTab}
            onPress={setActiveTab}
            icon="stats"
          />
          <TabButton
            label="Gym"
            tab="gym"
            activeTab={activeTab}
            onPress={setActiveTab}
            icon="gym"
          />
          <TabButton
            label="Profile"
            tab="profile"
            activeTab={activeTab}
            onPress={setActiveTab}
            icon="profile"
          />
        </nav>
      </main>
    </>
  );
}

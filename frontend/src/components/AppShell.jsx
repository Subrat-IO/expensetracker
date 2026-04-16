"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import PwaRegister from "./PwaRegister";

const TOKEN_KEY = "discipline_tracker_token";
const USER_KEY = "discipline_tracker_user";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://expensetracker-zwgt.onrender.com";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
    </>
  ),
  stats: <path d="M5 18.5h14M7.5 16V9.5M12 16V5.5M16.5 16v-7" />,
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
  logout: (
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  ),
  chevron: <path d="M9 18l6-6-6-6" />,
  fire: (
    <path d="M12 2c0 6-6 6-6 12a6 6 0 0 0 12 0c0-3-1.5-5-3-7-1 2-2 3-2 5a2 2 0 0 1-4 0c0-4 3-6 3-10z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  wallet: (
    <path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M16 12h4M18 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  arrow_up: <path d="M7 17l10-10M7 7h10v10" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />,
  edit: (
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  camera: (
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  ),
  search: <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  quote: <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />,
  refresh: <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  food: <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />,
  car: <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>,
  shopping: <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
  health: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  entertainment: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>,
  bill: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
};

// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "general",       label: "General",       icon: "wallet",        color: "#30d158" },
  { value: "food",          label: "Food & Drink",  icon: "food",          color: "#ff9f0a" },
  { value: "transport",     label: "Transport",     icon: "car",           color: "#0a84ff" },
  { value: "shopping",      label: "Shopping",      icon: "shopping",      color: "#bf5af2" },
  { value: "health",        label: "Health",        icon: "health",        color: "#ff453a" },
  { value: "entertainment", label: "Entertainment", icon: "entertainment", color: "#ffd60a" },
  { value: "bills",         label: "Bills",         icon: "bill",          color: "#64d2ff" },
];

function getCategoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];
}

// ─── Auto-category detection ─────────────────────────────────────────────────
const KEYWORD_CATEGORIES = {
  food: ["coffee", "tea", "lunch", "dinner", "breakfast", "snack", "restaurant", "cafe", "zomato", "swiggy", "pizza", "burger", "food", "chai", "maggi", "biryani", "rice", "dal", "dosa", "idli", "paratha", "thali", "curry"],
  transport: ["uber", "ola", "bus", "auto", "metro", "taxi", "petrol", "fuel", "cab", "travel", "train", "flight", "rickshaw", "rapido", "toll", "parking"],
  shopping: ["amazon", "flipkart", "myntra", "clothes", "shirt", "shoes", "shopping", "purchase", "mall", "market", "dress", "jeans", "bag", "watch"],
  health: ["medicine", "doctor", "hospital", "pharmacy", "gym", "health", "medical", "clinic", "chemist", "tablet", "injection", "test"],
  entertainment: ["movie", "netflix", "spotify", "youtube", "game", "party", "fun", "concert", "hotstar", "prime", "theatre", "sport"],
  bills: ["electricity", "water", "internet", "wifi", "bill", "subscription", "rent", "recharge", "mobile", "emi", "insurance", "gas"],
};
function detectCategory(note) {
  if (!note) return "general";
  const lower = note.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "general";
}

// ─── Quick-add presets ───────────────────────────────────────────────────────
const QUICK_ADDS = [
  { label: "☕ Coffee", amount: 50, category: "food", note: "Coffee" },
  { label: "🚌 Bus", amount: 20, category: "transport", note: "Bus fare" },
  { label: "🍱 Lunch", amount: 120, category: "food", note: "Lunch" },
  { label: "⚡ Recharge", amount: 199, category: "bills", note: "Mobile recharge" },
];

// ─── Workout types ───────────────────────────────────────────────────────────
const WORKOUT_TYPES = [
  { value: "", label: "General" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "legs", label: "Legs" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
  { value: "fullbody", label: "Full Body" },
];

// ─── Quotes ──────────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "It's not your salary that makes you rich, it's your spending habits.", author: "Charles A. Jaffe" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "The secret to wealth is simple: find a way to do more for others than anyone else does.", author: "Tony Robbins" },
  { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The first step toward success is taken when you refuse to be a captive of the environment.", author: "Mark Caine" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Bombell" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
];

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  :root {
    --bg:           #000000;
    --bg2:          #080808;
    --s1:           rgba(22,22,26,0.95);
    --s2:           rgba(32,32,38,0.8);
    --s3:           rgba(48,48,56,0.65);
    --border:       rgba(255,255,255,0.08);
    --border2:      rgba(255,255,255,0.13);
    --border3:      rgba(255,255,255,0.2);
    --text:         #f5f5f7;
    --text2:        rgba(245,245,247,0.55);
    --text3:        rgba(245,245,247,0.32);
    --green:        #30d158;
    --green2:       #28b84c;
    --green-dim:    rgba(48,209,88,0.14);
    --green-glow:   rgba(48,209,88,0.28);
    --blue:         #0a84ff;
    --blue-dim:     rgba(10,132,255,0.14);
    --yellow:       #ffd60a;
    --yellow-dim:   rgba(255,214,10,0.14);
    --orange:       #ff9f0a;
    --orange-dim:   rgba(255,159,10,0.14);
    --red:          #ff453a;
    --red-dim:      rgba(255,69,58,0.14);
    --purple:       #bf5af2;
    --purple-dim:   rgba(191,90,242,0.14);
    --r-xs: 10px; --r-sm: 14px; --r-md: 18px; --r-lg: 24px;
    --r-xl: 28px; --r-2xl: 36px; --r-pill: 999px;
    --safe-top: env(safe-area-inset-top);
    --safe-bottom: env(safe-area-inset-bottom);
    --transition: 180ms cubic-bezier(0.34,1.2,0.64,1);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; overflow-x: hidden; height: 100%; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif; color: var(--text); font-weight: 400; letter-spacing: -0.01em; }
  button { border: none; cursor: pointer; background: none; font: inherit; font-weight: 500; }
  input  { font: inherit; width: 100%; outline: none; letter-spacing: -0.01em; }
  #__next { min-height: 100%; }

  .ls-wrap { display: grid; place-items: center; gap: 24px; text-align: center; min-height: 100vh; background: #000; }
  .ls-ring { width: 60px; height: 60px; border-radius: 50%; border: 2.5px solid rgba(48,209,88,0.12); border-top-color: var(--green); animation: spin 1.2s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .ls-label { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3); }

  .login-wrap { min-height: 100vh; width: 100vw; padding: calc(var(--safe-top) + 48px) 24px calc(var(--safe-bottom) + 48px); background: #000; display: flex; flex-direction: column; justify-content: center; gap: 40px; position: relative; overflow: hidden; }
  .login-orb { position: absolute; border-radius: 50%; pointer-events: none; }
  .login-orb-1 { width: 320px; height: 320px; background: radial-gradient(circle, rgba(48,209,88,0.18) 0%, transparent 70%); top: -80px; right: -80px; }
  .login-orb-2 { width: 280px; height: 280px; background: radial-gradient(circle, rgba(10,132,255,0.12) 0%, transparent 70%); bottom: 60px; left: -80px; }
  .login-brand { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; }
  .login-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--green); }
  .login-title { font-size: clamp(2.4rem, 10vw, 3.6rem); font-weight: 800; line-height: 1.0; letter-spacing: -0.03em; color: var(--text); }
  .login-title em { font-style: normal; color: var(--green); }
  .login-sub { font-size: 15px; color: var(--text2); line-height: 1.6; max-width: 320px; }
  .login-card { position: relative; z-index: 1; background: var(--s1); border: 0.5px solid var(--border3); border-radius: var(--r-2xl); padding: 28px 24px; display: flex; flex-direction: column; gap: 18px; animation: slideUp 500ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: 120ms; backdrop-filter: blur(20px); }
  @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  .field-lbl { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3); margin-bottom: 8px; }
  .field-wrap { position: relative; }
  .field-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; opacity: 0.35; pointer-events: none; }
  .field-input { height: 52px; width: 100%; padding: 0 16px 0 48px; background: rgba(255,255,255,0.06); border: 0.5px solid var(--border2); border-radius: var(--r-md); color: var(--text); font-size: 16px; font-weight: 400; transition: border-color 160ms, box-shadow 160ms, background 160ms; letter-spacing: -0.01em; }
  .field-input::placeholder { color: var(--text3); }
  .field-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(48,209,88,0.16), inset 0 0 0 0.5px var(--green); background: rgba(255,255,255,0.08); }
  .login-error { padding: 14px 16px; border-radius: var(--r-sm); background: rgba(255,69,58,0.13); border: 0.5px solid rgba(255,69,58,0.28); color: var(--red); font-size: 14px; font-weight: 500; }
  .btn-primary { height: 56px; border-radius: var(--r-pill); background: var(--green); color: #000; font-size: 15px; font-weight: 700; letter-spacing: 0.01em; box-shadow: 0 0 28px rgba(48,209,88,0.32); transition: transform var(--transition), box-shadow var(--transition), opacity 140ms; width: 100%; border: none; cursor: pointer; }
  .btn-primary:active { transform: scale(0.96); opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.48; cursor: not-allowed; }
  .login-hint { text-align: center; font-size: 12px; color: var(--text3); font-weight: 400; }
  .login-footer { position: relative; z-index: 1; text-align: center; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); }

  .shell { width: 100vw; height: 100vh; display: flex; flex-direction: column; background: #000; overflow: hidden; padding-top: calc(var(--safe-top) + 8px); padding-bottom: var(--safe-bottom); }

  .topbar { padding: 18px 22px 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .topbar-left { flex: 1; min-width: 0; }
  .topbar-greeting { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); margin-bottom: 4px; }
  .topbar-name { font-size: clamp(1.8rem, 6vw, 2.4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .topbar-date { margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--r-sm); background: rgba(48,209,88,0.1); border: 0.5px solid rgba(48,209,88,0.2); }
  .topbar-date-tag { height: 22px; padding: 0 9px; border-radius: var(--r-pill); background: var(--green); color: #000; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; }
  .topbar-date-text { font-size: 13px; font-weight: 500; color: var(--text2); }
  .topbar-budget-pill { height: 38px; padding: 0 14px; border-radius: var(--r-pill); background: rgba(48,209,88,0.08); border: 0.5px solid rgba(48,209,88,0.2); display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .topbar-budget-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
  .topbar-budget-text { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
  .topbar-profile-btn { width: 44px; height: 44px; border-radius: var(--r-pill); background: rgba(48,209,88,0.1); border: 1.5px solid rgba(48,209,88,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; transition: background var(--transition), border-color var(--transition), transform 120ms ease; position: relative; overflow: hidden; }
  .topbar-profile-btn:hover { background: rgba(48,209,88,0.15); border-color: rgba(48,209,88,0.4); }
  .topbar-profile-btn:active { transform: scale(0.95); }
  .topbar-profile-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .topbar-profile-initials { font-size: 14px; font-weight: 700; color: var(--green); letter-spacing: -0.02em; }
  .profile-upload-input { display: none; }

  .content { flex: 1; overflow-y: auto; padding: 4px 18px 140px; scrollbar-width: none; }
  .content::-webkit-scrollbar { display: none; }

  .error-banner { margin-bottom: 16px; padding: 14px 16px; border-radius: var(--r-md); background: rgba(255,69,58,0.11); border: 0.5px solid rgba(255,69,58,0.24); color: var(--red); font-size: 14px; font-weight: 500; }
  .tab-panel { display: flex; flex-direction: column; gap: 16px; }

  .hero { border-radius: var(--r-2xl); padding: 26px 22px; position: relative; overflow: hidden; border: 0.5px solid transparent; backdrop-filter: blur(10px); }
  .hero-success { background: linear-gradient(145deg, #0b1f10 0%, #060e09 100%); border-color: rgba(48,209,88,0.22); }
  .hero-warning { background: linear-gradient(145deg, #1a1500 0%, #0e0b00 100%); border-color: rgba(255,214,10,0.22); }
  .hero-danger { background: linear-gradient(145deg, #1f0a09 0%, #0e0504 100%); border-color: rgba(255,69,58,0.22); }
  .hero-glow { position: absolute; border-radius: 50%; pointer-events: none; }
  .hero-glow-1 { width: 220px; height: 220px; top: -70px; right: -50px; background: radial-gradient(circle, rgba(48,209,88,0.22), transparent 70%); }
  .hero-glow-2 { width: 160px; height: 160px; bottom: -40px; left: -20px; background: radial-gradient(circle, rgba(255,214,10,0.1), transparent 70%); }
  .hero-warning .hero-glow-1 { background: radial-gradient(circle, rgba(255,214,10,0.22), transparent 70%); }
  .hero-danger .hero-glow-1 { background: radial-gradient(circle, rgba(255,69,58,0.22), transparent 70%); }
  .hero-inner { position: relative; z-index: 1; }
  .hero-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .hero-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); margin-bottom: 6px; }
  .hero-warning .hero-eyebrow { color: var(--yellow); }
  .hero-danger .hero-eyebrow { color: var(--red); }
  .hero-amount { font-size: 44px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; color: var(--text); }
  .pill { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px; border-radius: var(--r-pill); font-size: 12px; font-weight: 600; flex-shrink: 0; }
  .pill-success { background: rgba(48,209,88,0.15); color: var(--green); border: 0.5px solid rgba(48,209,88,0.25); }
  .pill-warning { background: rgba(255,214,10,0.15); color: var(--yellow); border: 0.5px solid rgba(255,214,10,0.25); }
  .pill-danger { background: rgba(255,69,58,0.15); color: var(--red); border: 0.5px solid rgba(255,69,58,0.25); }
  .pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .hero-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
  .hero-metric { background: rgba(255,255,255,0.06); border: 0.5px solid var(--border); border-radius: var(--r-md); padding: 14px 12px; }
  .hero-metric-lbl { font-size: 11px; color: var(--text3); font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
  .hero-metric-val { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
  .progress-track { width: 100%; height: 4px; border-radius: var(--r-pill); background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 20px; }
  .progress-fill { height: 100%; border-radius: inherit; transition: width 600ms cubic-bezier(0.22,1,0.36,1); }
  .progress-fill-success { background: linear-gradient(90deg, var(--green2), var(--green)); }
  .progress-fill-warning { background: linear-gradient(90deg, #9a8000, var(--yellow)); }
  .progress-fill-danger { background: linear-gradient(90deg, #a01c18, var(--red)); }

  .card { background: var(--s1); border: 0.5px solid var(--border2); border-radius: var(--r-xl); padding: 20px 18px; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
  .card-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); margin-bottom: 4px; }
  .card-title { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }

  .expense-form { display: flex; flex-direction: column; gap: 12px; }
  .plain-input { height: 52px; width: 100%; padding: 0 16px; background: rgba(255,255,255,0.04); border: 0.5px solid var(--border2); border-radius: var(--r-md); color: var(--text); font-size: 16px; font-weight: 400; transition: border-color 160ms, box-shadow 160ms; letter-spacing: -0.01em; }
  .plain-input::placeholder { color: var(--text3); }
  .plain-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(48,209,88,0.12); }

  /* ── Swipeable Expense Rows ── */
  .expense-rows { display: flex; flex-direction: column; overflow: hidden; border-radius: var(--r-md); }

  .swipe-wrapper {
    position: relative;
    overflow: hidden;
    border-bottom: 0.5px solid var(--border);
  }
  .swipe-wrapper:last-child { border-bottom: none; }

  .swipe-actions {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    display: flex;
    align-items: stretch;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }
  .swipe-wrapper.revealed .swipe-actions {
    opacity: 1;
    pointer-events: auto;
  }
  .swipe-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    width: 72px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    cursor: pointer; border: none; transition: filter 120ms;
  }
  .swipe-btn:active { filter: brightness(0.85); }
  .swipe-btn-edit { background: rgba(10,132,255,0.18); color: var(--blue); }
  .swipe-btn-delete { background: rgba(255,69,58,0.18); color: var(--red); border-radius: 0 var(--r-sm) var(--r-sm) 0; }

  .swipe-row-inner {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 0;
    width: 100%;
    background: var(--s1);
    position: relative; z-index: 2;
    transform: translateX(0);
    transition: transform 300ms cubic-bezier(0.22,1,0.36,1);
    will-change: transform;
    touch-action: pan-y;
    cursor: grab;
    user-select: none;
  }
  .swipe-row-inner.swiped { transform: translateX(-144px); }
  .swipe-row-inner:active { cursor: grabbing; }

  .expense-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; background: var(--green-dim); border: 0.5px solid rgba(48,209,88,0.15); display: flex; align-items: center; justify-content: center; }
  .expense-note { font-size: 15px; font-weight: 500; color: var(--text); }
  .expense-time { font-size: 12px; color: var(--text3); margin-top: 2px; }
  .expense-amount { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; flex-shrink: 0; }
  .empty-box { padding: 28px 18px; text-align: center; background: rgba(255,255,255,0.03); border: 0.5px dashed var(--border2); border-radius: var(--r-lg); color: var(--text3); font-size: 14px; }

  /* ── Edit Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    display: flex; align-items: flex-end; justify-content: center;
    animation: fadeIn 200ms ease both;
  }
  .modal-sheet {
    width: 100%; max-width: 480px;
    background: #111114;
    border: 0.5px solid var(--border3);
    border-radius: 28px 28px 0 0;
    padding: 12px 24px 48px;
    display: flex; flex-direction: column; gap: 20px;
    animation: sheetUp 320ms cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-handle {
    width: 36px; height: 4px; border-radius: var(--r-pill);
    background: var(--border3); margin: 0 auto;
  }
  .modal-title { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }
  .modal-actions { display: flex; gap: 10px; }
  .btn-modal-cancel {
    flex: 1; height: 52px; border-radius: var(--r-pill);
    background: rgba(255,255,255,0.07); border: 0.5px solid var(--border2);
    color: var(--text2); font-size: 15px; font-weight: 600;
    transition: transform var(--transition), background var(--transition);
  }
  .btn-modal-cancel:active { transform: scale(0.97); background: rgba(255,255,255,0.1); }
  .btn-modal-save {
    flex: 1; height: 52px; border-radius: var(--r-pill);
    background: var(--green); color: #000;
    font-size: 15px; font-weight: 700;
    box-shadow: 0 0 20px rgba(48,209,88,0.28);
    transition: transform var(--transition), opacity 140ms;
  }
  .btn-modal-save:active { transform: scale(0.97); opacity: 0.88; }
  .btn-modal-save:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Delete confirm ── */
  .delete-confirm-overlay {
    position: fixed; inset: 0; z-index: 400;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
    animation: fadeIn 180ms ease both;
  }
  .delete-confirm-card {
    width: 100%; max-width: 340px;
    background: #111114; border: 0.5px solid rgba(255,69,58,0.25);
    border-radius: var(--r-2xl); padding: 28px 24px;
    display: flex; flex-direction: column; gap: 20px;
    animation: scaleIn 250ms cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  .delete-confirm-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(255,69,58,0.12); border: 0.5px solid rgba(255,69,58,0.25);
    display: flex; align-items: center; justify-content: center; margin: 0 auto;
  }
  .delete-confirm-title { font-size: 18px; font-weight: 700; color: var(--text); text-align: center; }
  .delete-confirm-sub { font-size: 14px; color: var(--text2); text-align: center; line-height: 1.55; }
  .delete-confirm-actions { display: flex; gap: 10px; }
  .btn-delete-cancel { flex: 1; height: 50px; border-radius: var(--r-pill); background: rgba(255,255,255,0.07); border: 0.5px solid var(--border2); color: var(--text2); font-size: 15px; font-weight: 600; transition: transform 120ms ease; }
  .btn-delete-cancel:active { transform: scale(0.97); }
  .btn-delete-confirm { flex: 1; height: 50px; border-radius: var(--r-pill); background: rgba(255,69,58,0.15); border: 0.5px solid rgba(255,69,58,0.3); color: var(--red); font-size: 15px; font-weight: 700; transition: transform 120ms ease, background 140ms; }
  .btn-delete-confirm:active { transform: scale(0.97); background: rgba(255,69,58,0.22); }
  .btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

  .fab { position: fixed; bottom: calc(var(--safe-bottom) + 96px); left: 50%; transform: translateX(-50%); height: 54px; padding: 0 28px; background: var(--green); color: #000; border-radius: var(--r-pill); font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 9px; box-shadow: 0 4px 32px rgba(48,209,88,0.35); transition: transform var(--transition), box-shadow var(--transition); z-index: 50; white-space: nowrap; }
  .fab:active { transform: translateX(-50%) scale(0.96); }
  .fab:disabled { opacity: 0.5; }

  .insight-card { border-radius: var(--r-2xl); padding: 28px 22px; position: relative; overflow: hidden; background: linear-gradient(145deg, #0b1f10 0%, #060e09 100%); border: 0.5px solid rgba(48,209,88,0.2); }
  .insight-glow { position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(48,209,88,0.2), transparent 70%); }
  .insight-inner { position: relative; z-index: 1; }
  .insight-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
  .insight-title { font-size: 24px; font-weight: 800; letter-spacing: -0.04em; color: var(--text); line-height: 1.1; }
  .insight-sub { font-size: 14px; color: var(--text2); margin-top: 8px; line-height: 1.5; }
  .metric-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .metric-tile { background: var(--s1); border: 0.5px solid var(--border2); border-radius: var(--r-lg); padding: 18px 16px; }
  .metric-lbl { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text3); margin-bottom: 6px; }
  .metric-val { font-size: 22px; font-weight: 800; letter-spacing: -0.04em; color: var(--text); }
  .metric-sub { font-size: 12px; color: var(--text3); margin-top: 4px; }
  .chart-area { height: 140px; display: flex; align-items: flex-end; gap: 8px; padding-top: 8px; }
  .chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; }
  .chart-bar { width: 100%; border-radius: 4px 4px 2px 2px; background: linear-gradient(180deg, var(--green) 0%, rgba(48,209,88,0.35) 100%); transition: height 400ms cubic-bezier(0.22,1,0.36,1); }
  .chart-bar-hot { background: linear-gradient(180deg, var(--orange) 0%, rgba(255,69,58,0.35) 100%); }
  .chart-day-lbl { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; }
  .comp-row { display: grid; grid-template-columns: 80px 1fr auto; gap: 12px; align-items: center; margin-top: 14px; }
  .comp-lbl { font-size: 13px; color: var(--text2); }
  .comp-track { width: 100%; height: 4px; background: rgba(255,255,255,0.07); border-radius: var(--r-pill); overflow: hidden; }
  .comp-fill { height: 100%; border-radius: inherit; }
  .comp-fill-green { background: linear-gradient(90deg, var(--green2), var(--green)); }
  .comp-fill-yellow { background: linear-gradient(90deg, #8a7000, var(--yellow)); }
  .comp-val { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; }
  .comp-note { font-size: 13px; color: var(--text3); margin-top: 16px; line-height: 1.5; }

  .gym-hero { border-radius: var(--r-2xl); padding: 26px 22px; position: relative; overflow: hidden; background: linear-gradient(145deg, #0b1f10 0%, #060e09 100%); border: 0.5px solid rgba(48,209,88,0.2); }
  .gym-hero-glow { position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(48,209,88,0.22), transparent 70%); }
  .gym-inner { position: relative; z-index: 1; }
  .gym-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .ios-toggle-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
  .ios-toggle-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3); }
  .ios-toggle { width: 52px; height: 31px; border-radius: var(--r-pill); position: relative; background: rgba(255,255,255,0.12); transition: background 220ms; cursor: pointer; }
  .ios-toggle.on { background: var(--green); }
  .ios-toggle-thumb { position: absolute; width: 27px; height: 27px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: left 220ms cubic-bezier(0.34,1.4,0.64,1); box-shadow: 0 2px 6px rgba(0,0,0,0.5); }
  .ios-toggle.on .ios-toggle-thumb { left: 23px; }
  .gym-motive { padding: 18px 16px; border-radius: var(--r-lg); background: rgba(48,209,88,0.06); border: 0.5px solid rgba(48,209,88,0.12); font-size: 14px; color: var(--text2); line-height: 1.6; }
  .cal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .cal-day { min-height: 82px; border-radius: var(--r-md); background: rgba(255,255,255,0.04); border: 0.5px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: background var(--transition), border-color var(--transition), transform 120ms ease; position: relative; overflow: hidden; }
  .cal-day.done { background: rgba(48,209,88,0.1); border-color: rgba(48,209,88,0.25); }
  .cal-day.today { border: 2px solid var(--green); box-shadow: 0 0 10px rgba(48,209,88,0.35), inset 0 0 8px rgba(48,209,88,0.08); }
  .cal-day.today .cal-num { color: var(--green); }
  .cal-day:active { transform: scale(0.95); }
  .cal-day:disabled { cursor: default; opacity: 0.6; }
  .cal-lbl { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
  .cal-num { font-size: 20px; font-weight: 800; color: var(--text); letter-spacing: -0.04em; }
  .cal-check { font-size: 16px; }
  .cal-day.done .cal-lbl { color: rgba(48,209,88,0.7); }

  .profile-score-card { border-radius: var(--r-2xl); padding: 32px 24px; text-align: center; background: linear-gradient(145deg, #100e1e 0%, #0b091a 100%); border: 0.5px solid rgba(191,90,242,0.2); position: relative; overflow: hidden; }
  .profile-score-glow { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 240px; height: 240px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(191,90,242,0.18), transparent 70%); }
  .profile-score-inner { position: relative; z-index: 1; }
  .profile-score-lbl { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(191,90,242,0.7); margin-bottom: 10px; }
  .profile-score { font-size: 72px; font-weight: 800; letter-spacing: -0.06em; color: var(--text); line-height: 1; }
  .profile-score sub { font-size: 28px; font-weight: 600; opacity: 0.4; vertical-align: bottom; }
  .profile-trend { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; height: 28px; padding: 0 12px; border-radius: var(--r-pill); background: rgba(191,90,242,0.12); border: 0.5px solid rgba(191,90,242,0.2); font-size: 12px; font-weight: 600; color: var(--purple); }
  .stat-list { display: flex; flex-direction: column; gap: 0; }
  .stat-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 15px 0; border-bottom: 0.5px solid var(--border); }
  .stat-row:last-child { border-bottom: none; padding-bottom: 0; }
  .stat-name { font-size: 14px; color: var(--text2); }
  .stat-val { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
  .stat-badge { height: 24px; padding: 0 10px; border-radius: var(--r-pill); font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; }
  .stat-badge-good { background: var(--green-dim); color: var(--green); border: 0.5px solid rgba(48,209,88,0.2); }
  .stat-badge-warn { background: var(--yellow-dim); color: var(--yellow); border: 0.5px solid rgba(255,214,10,0.2); }
  .btn-logout { height: 52px; width: 100%; border-radius: var(--r-pill); background: rgba(255,69,58,0.08); border: 0.5px solid rgba(255,69,58,0.2); color: var(--red); font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform var(--transition), background var(--transition); }
  .btn-logout:active { transform: scale(0.97); background: rgba(255,69,58,0.14); }
  .btn-clear-all { height: 52px; width: 100%; border-radius: var(--r-pill); background: rgba(255,69,58,0.06); border: 0.5px solid rgba(255,69,58,0.18); color: var(--red); font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform var(--transition), background var(--transition); margin-bottom: 12px; }
  .btn-clear-all:active { transform: scale(0.97); background: rgba(255,69,58,0.14); }

  /* ── Custom Date Picker ── */
  .datepicker-wrap { position: relative; flex: 1; }
  .datepicker-trigger { width: 100%; height: 44px; border-radius: var(--r-md); background: rgba(255,255,255,0.06); border: 0.5px solid var(--border2); color: var(--text); font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; cursor: pointer; transition: border-color 150ms; gap: 8px; white-space: nowrap; overflow: hidden; }
  .datepicker-trigger:focus { outline: none; border-color: var(--green); }
  .datepicker-trigger span { overflow: hidden; text-overflow: ellipsis; }
  .datepicker-trigger svg { width: 14px; height: 14px; fill: none; stroke: var(--text3); stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }
  .datepicker-popup { position: fixed; background: #1c1c26; border: 0.5px solid var(--border2); border-radius: 16px; padding: 14px; z-index: 9999; box-shadow: 0 16px 48px rgba(0,0,0,0.75); width: 296px; }
  .datepicker-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .datepicker-month-label { font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
  .datepicker-nav { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 0.5px solid var(--border2); color: var(--text2); font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 120ms; }
  .datepicker-nav:hover { background: rgba(255,255,255,0.1); }
  .datepicker-nav:disabled { opacity: 0.3; cursor: default; }
  .datepicker-dow { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 6px; }
  .datepicker-dow-cell { text-align: center; font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0; }
  .datepicker-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .dp-cell { height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: var(--text); cursor: pointer; transition: background 100ms; }
  .dp-cell:hover:not(.dp-empty):not(.dp-future) { background: rgba(255,255,255,0.1); }
  .dp-cell.dp-empty { cursor: default; }
  .dp-cell.dp-future { color: var(--text3); cursor: default; opacity: 0.3; }
  .dp-cell.dp-selected { background: var(--green) !important; color: #000; font-weight: 700; border-radius: 50%; }
  .dp-cell.dp-today { border: 1.5px solid rgba(48,209,88,0.7); color: var(--green); font-weight: 700; border-radius: 50%; }

  .bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; background: rgba(10,10,12,0.92); border-top: 0.5px solid var(--border2); border-radius: 22px 22px 0 0; display: grid; grid-template-columns: repeat(4, 1fr); padding: 10px 10px calc(var(--safe-bottom) + 12px); z-index: 100; backdrop-filter: blur(15px); }
  .nav-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; height: 58px; border-radius: var(--r-md); color: var(--text3); transition: color var(--transition), background var(--transition), transform 120ms ease; font-weight: 500; }
  .nav-btn.active { color: var(--green); background: rgba(48,209,88,0.12); }
  .nav-btn:active { transform: scale(0.93); }
  .nav-btn-label { font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
  .nav-icon { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

  /* ── Profile Photo UI ── */
  .profile-photo-section {
    display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 24px 0 8px;
  }
  .profile-photo-ring {
    width: 90px; height: 90px; border-radius: 50%;
    border: 2px solid rgba(48,209,88,0.4);
    padding: 3px;
    background: linear-gradient(145deg, rgba(48,209,88,0.1), rgba(10,132,255,0.08));
    cursor: pointer; position: relative;
    transition: border-color 200ms, transform 150ms;
  }
  .profile-photo-ring:hover { border-color: rgba(48,209,88,0.7); transform: scale(1.04); }
  .profile-photo-ring img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .profile-photo-initials-big {
    width: 100%; height: 100%; border-radius: 50%;
    background: rgba(48,209,88,0.08);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800; color: var(--green); letter-spacing: -0.03em;
  }
  .profile-photo-camera {
    position: absolute; bottom: 2px; right: 2px;
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--green); color: #000;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #111114;
  }
  .profile-photo-name { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: var(--text); }
  .profile-photo-username { font-size: 13px; color: var(--text3); margin-top: -8px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .fade-in { animation: fadeIn 400ms ease both; }
  .slide-in { animation: slideUp 380ms cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Filter tabs ── */
  .filter-tabs { display: flex; gap: 6px; margin-bottom: 4px; }
  .filter-tab { height: 32px; padding: 0 14px; border-radius: var(--r-pill); font-size: 12px; font-weight: 600; letter-spacing: 0.03em; border: 0.5px solid var(--border2); background: rgba(255,255,255,0.04); color: var(--text3); transition: background 150ms, color 150ms, border-color 150ms; cursor: pointer; white-space: nowrap; }
  .filter-tab.active { background: rgba(48,209,88,0.14); color: var(--green); border-color: rgba(48,209,88,0.3); }
  .filter-tab:active { transform: scale(0.96); }

  /* ── Search bar ── */
  .search-wrap { position: relative; margin-bottom: 4px; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; fill: none; stroke: var(--text3); stroke-width: 1.8; stroke-linecap: round; pointer-events: none; }
  .search-input { height: 44px; width: 100%; padding: 0 14px 0 42px; background: rgba(255,255,255,0.04); border: 0.5px solid var(--border2); border-radius: var(--r-md); color: var(--text); font-size: 14px; font-weight: 400; transition: border-color 160ms, box-shadow 160ms; letter-spacing: -0.01em; }
  .search-input::placeholder { color: var(--text3); }
  .search-input:focus { border-color: rgba(48,209,88,0.4); box-shadow: 0 0 0 3px rgba(48,209,88,0.08); }

  /* ── Category selector ── */
  .cat-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-chip { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: var(--r-pill); border: 0.5px solid var(--border2); background: rgba(255,255,255,0.04); color: var(--text2); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 150ms, border-color 150ms, color 150ms; flex-shrink: 0; }
  .cat-chip.active { border-color: currentColor; background: rgba(255,255,255,0.06); }
  .cat-chip svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
  .cat-chip:active { transform: scale(0.96); }

  /* ── Insight alert ── */
  .insight-alert { padding: 12px 16px; border-radius: var(--r-md); border: 0.5px solid; font-size: 13px; font-weight: 500; line-height: 1.45; display: flex; align-items: flex-start; gap: 10px; }
  .insight-alert svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; flex-shrink: 0; margin-top: 1px; }
  .insight-alert-warn { background: rgba(255,159,10,0.08); border-color: rgba(255,159,10,0.25); color: var(--orange); }
  .insight-alert-good { background: rgba(48,209,88,0.08); border-color: rgba(48,209,88,0.25); color: var(--green); }
  .insight-alert-bad { background: rgba(255,69,58,0.08); border-color: rgba(255,69,58,0.25); color: var(--red); }

  /* ── Chart tooltip ── */
  .chart-col { position: relative; }
  .chart-col:hover .chart-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
  .chart-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%) translateY(4px); background: rgba(30,30,36,0.96); border: 0.5px solid var(--border3); border-radius: 8px; padding: 4px 8px; font-size: 11px; font-weight: 700; color: var(--text); white-space: nowrap; opacity: 0; transition: opacity 150ms, transform 150ms; pointer-events: none; z-index: 10; }

  /* ── Quote card ── */
  .quote-card { background: rgba(191,90,242,0.06); border: 0.5px solid rgba(191,90,242,0.18); border-radius: var(--r-xl); padding: 20px 18px; position: relative; }
  .quote-text { font-size: 14px; color: var(--text2); line-height: 1.65; font-style: italic; }
  .quote-author { margin-top: 10px; font-size: 12px; font-weight: 700; color: rgba(191,90,242,0.7); letter-spacing: 0.05em; }
  .quote-refresh-btn { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border-radius: 50%; background: rgba(191,90,242,0.1); border: 0.5px solid rgba(191,90,242,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 150ms, transform 200ms; }
  .quote-refresh-btn:hover { background: rgba(191,90,242,0.18); }
  .quote-refresh-btn:active { transform: rotate(180deg); }
  .quote-refresh-btn svg { width: 14px; height: 14px; fill: none; stroke: rgba(191,90,242,0.7); stroke-width: 1.8; stroke-linecap: round; }

  /* ── Export / danger buttons ── */
  .action-row { display: flex; gap: 10px; }
  .btn-export { flex: 1; height: 46px; border-radius: var(--r-pill); background: rgba(10,132,255,0.08); border: 0.5px solid rgba(10,132,255,0.22); color: var(--blue); font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: background 150ms, transform 120ms; }
  .btn-export:active { transform: scale(0.97); background: rgba(10,132,255,0.14); }
  .btn-export svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
  .btn-danger { flex: 1; height: 46px; border-radius: var(--r-pill); background: rgba(255,69,58,0.08); border: 0.5px solid rgba(255,69,58,0.22); color: var(--red); font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: background 150ms, transform 120ms; }
  .btn-danger:active { transform: scale(0.97); background: rgba(255,69,58,0.14); }
  .btn-danger svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }

  /* ── Install prompt ── */
  .install-banner { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: var(--r-md); background: rgba(10,132,255,0.08); border: 0.5px solid rgba(10,132,255,0.22); margin-bottom: 4px; }
  .install-banner-text { flex: 1; font-size: 13px; color: var(--text2); line-height: 1.4; }
  .install-banner-text strong { color: var(--text); font-weight: 600; }
  .install-btn { height: 34px; padding: 0 16px; border-radius: var(--r-pill); background: var(--blue); color: #fff; font-size: 12px; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; transition: opacity 150ms; }
  .install-btn:active { opacity: 0.85; }

  /* ── Monthly gym grid ── */
  .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .month-cell { aspect-ratio: 1; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; }
  .month-cell-done { background: rgba(48,209,88,0.2); color: var(--green); }
  .month-cell-empty { background: rgba(255,255,255,0.03); color: var(--text3); }
  .month-cell-today { outline: 1.5px solid rgba(48,209,88,0.5); }
  .month-day-header { font-size: 9px; font-weight: 700; color: var(--text3); text-transform: uppercase; text-align: center; padding-bottom: 4px; letter-spacing: 0.06em; }

  /* ── Expense date label ── */
  .exp-date-badge { font-size: 10px; font-weight: 600; color: var(--text3); background: rgba(255,255,255,0.05); border: 0.5px solid var(--border); border-radius: 6px; padding: 2px 7px; }
  .exp-date-section { padding: 10px 18px 4px; font-size: 11px; font-weight: 700; color: var(--text3); letter-spacing: 0.08em; text-transform: uppercase; background: rgba(18,18,22,0.98); }

  /* ── Select field ── */
  .add-select { height: 52px; width: 100%; padding: 0 14px; background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.12); border-radius: 14px; color: #f5f5f7; font-size: 14px; font-weight: 500; font-family: inherit; outline: none; -webkit-appearance: none; appearance: none; cursor: pointer; transition: border-color 160ms; }
  .add-select:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(48,209,88,0.12); }
  .edit-field-select { width: 100%; height: 52px; padding: 0 16px; background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.14); border-radius: 14px; color: #f5f5f7; font-size: 16px; font-weight: 500; font-family: inherit; outline: none; -webkit-appearance: none; appearance: none; cursor: pointer; transition: border-color 160ms; }
  .edit-field-select:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(48,209,88,0.14); }

  /* ── Quick-add buttons ── */
  .quick-add-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; margin-bottom: 4px; }
  .quick-add-row::-webkit-scrollbar { display: none; }
  .quick-add-btn { flex-shrink: 0; height: 36px; padding: 0 14px; border-radius: var(--r-pill); background: rgba(255,255,255,0.05); border: 0.5px solid var(--border2); color: var(--text2); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 150ms, border-color 150ms, color 150ms, transform 120ms; }
  .quick-add-btn:hover { background: rgba(48,209,88,0.1); border-color: rgba(48,209,88,0.3); color: var(--green); }
  .quick-add-btn:active { transform: scale(0.95); }

  /* ── Prediction card ── */
  .prediction-card { border-radius: var(--r-lg); padding: 16px; background: rgba(10,132,255,0.06); border: 0.5px solid rgba(10,132,255,0.2); display: flex; align-items: center; gap: 14px; }
  .prediction-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(10,132,255,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .prediction-icon svg { width: 18px; height: 18px; fill: none; stroke: var(--blue); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .prediction-body { flex: 1; }
  .prediction-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(10,132,255,0.7); margin-bottom: 3px; }
  .prediction-val { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: var(--text); }
  .prediction-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }

  /* ── Workout type chips ── */
  .workout-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .workout-chip { height: 32px; padding: 0 14px; border-radius: var(--r-pill); font-size: 12px; font-weight: 600; border: 0.5px solid var(--border2); background: rgba(255,255,255,0.04); color: var(--text3); cursor: pointer; transition: background 150ms, color 150ms, border-color 150ms, transform 120ms; }
  .workout-chip.active { background: rgba(48,209,88,0.12); color: var(--green); border-color: rgba(48,209,88,0.3); }
  .workout-chip:active { transform: scale(0.95); }

  /* ── Notification banner ── */
  .notif-banner { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r-md); background: rgba(255,214,10,0.06); border: 0.5px solid rgba(255,214,10,0.2); margin-bottom: 4px; }
  .notif-banner-text { flex: 1; font-size: 13px; color: var(--text2); line-height: 1.4; }
  .notif-banner-text strong { color: var(--text); font-weight: 600; }
  .notif-btn { height: 34px; padding: 0 14px; border-radius: var(--r-pill); background: var(--yellow); color: #000; font-size: 12px; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; }
  .notif-btn:active { opacity: 0.85; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normalizeApiDate(v) {
  return v
    ? typeof v === "string" && v.length >= 10
      ? v.slice(0, 10)
      : formatDate(v)
    : "";
}
function getTodayKey() {
  return formatDate(new Date());
}
function buildAssetUrl(path) {
  if (!path) return "/myprofile.png";
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return path;
}
function getStartOfWeek(date = new Date()) {
  const c = new Date(date);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
}
function currency(value, code = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code,
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
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

async function fetchJson(path, options = {}, authToken) {
  const headers = new Headers(options.headers || {});
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(
      payload.message || `Request failed: ${response.status}`,
    );
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ name, className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "nav-icon"} style={style}>
      {ICONS[name]}
    </svg>
  );
}

// ─── Swipeable Expense Row ────────────────────────────────────────────────────
function SwipeableExpenseRow({ exp, code, onEdit, onDelete, showDate }) {
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const rowRef = useRef(null);
  const catMeta = getCategoryMeta(exp.category || "general");

  function handleTouchStart(e) {
    setStartX(e.touches[0].clientX);
    setDragging(true);
  }
  function handleTouchMove(e) {
    if (!dragging || startX === null) return;
    const dx = e.touches[0].clientX - startX;
    if (dx < -30) setSwiped(true);
    if (dx > 30) setSwiped(false);
  }
  function handleTouchEnd() {
    setDragging(false);
    setStartX(null);
  }

  function handleMouseDown(e) {
    setStartX(e.clientX);
    setDragging(true);
  }
  function handleMouseMove(e) {
    if (!dragging || startX === null) return;
    const dx = e.clientX - startX;
    if (dx < -40) setSwiped(true);
    if (dx > 40) setSwiped(false);
  }
  function handleMouseUp() {
    setDragging(false);
    setStartX(null);
  }

  function handleEditClick(e) {
    e.stopPropagation();
    setSwiped(false);
    onEdit(exp);
  }
  function handleDeleteClick(e) {
    e.stopPropagation();
    setSwiped(false);
    onDelete(exp);
  }

  const timeStr = exp.createdAt
    ? new Date(exp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`swipe-wrapper${swiped ? " revealed" : ""}`}>
      <div className="swipe-actions">
        <button className="swipe-btn swipe-btn-edit" onClick={handleEditClick}>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            {ICONS.edit}
          </svg>
          Edit
        </button>
        <button className="swipe-btn swipe-btn-delete" onClick={handleDeleteClick}>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
            {ICONS.trash}
          </svg>
          Delete
        </button>
      </div>

      <div
        ref={rowRef}
        className={`swipe-row-inner${swiped ? " swiped" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => { if (swiped) setSwiped(false); }}
      >
        <div className="expense-icon" style={{ background: `${catMeta.color}18`, borderColor: `${catMeta.color}28` }}>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: catMeta.color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }}>
            {ICONS[catMeta.icon] || ICONS.wallet}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="expense-note">{exp.note || "Unlabelled"}</p>
          <p className="expense-time">
            {showDate && exp.date ? (
              <span>{new Date(exp.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{timeStr ? ` · ${timeStr}` : ""}</span>
            ) : timeStr}
            {exp.category && exp.category !== "general" && (
              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: catMeta.color, background: `${catMeta.color}18`, padding: "2px 6px", borderRadius: 6 }}>
                {catMeta.label}
              </span>
            )}
          </p>
        </div>
        <span className="expense-amount">{currency(exp.amount, code)}</span>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditExpenseModal({ expense, onSave, onClose, isSaving }) {
  const [amount, setAmount] = useState(String(expense.amount || ""));
  const [note, setNote] = useState(expense.note || "");
  const [category, setCategory] = useState(expense.category || "general");
  const [date, setDate] = useState(expense.date || getTodayKey());

  function handleSave() {
    const num = Number(amount);
    if (!num) return;
    onSave({ ...expense, amount: num, note: note.trim(), category, date });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <p className="modal-title">Edit Expense</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p className="field-lbl">Amount (₹)</p>
            <input
              className="plain-input"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <p className="field-lbl">Note</p>
            <input
              className="plain-input"
              type="text"
              placeholder="Coffee, travel, snack…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div>
            <p className="field-lbl">Category</p>
            <select
              className="edit-field-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="field-lbl">Date</p>
            <input
              className="plain-input"
              type="date"
              value={date}
              max={getTodayKey()}
              onChange={(e) => setDate(e.target.value)}
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-modal-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirmModal({ expense, onConfirm, onClose, isDeleting, code }) {
  return (
    <div className="delete-confirm-overlay" onClick={onClose}>
      <div className="delete-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirm-icon">
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 24,
              height: 24,
              fill: "none",
              stroke: "var(--red)",
              strokeWidth: 1.8,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }}
          >
            {ICONS.trash}
          </svg>
        </div>
        <p className="delete-confirm-title">Delete Expense?</p>
        <p className="delete-confirm-sub">
          <strong style={{ color: "var(--text)" }}>
            {expense.note || "Unlabelled"}
          </strong>{" "}
          · {currency(expense.amount, code)}
          <br />
          This action cannot be undone.
        </p>
        <div className="delete-confirm-actions">
          <button className="btn-delete-cancel" onClick={onClose}>
            Keep it
          </button>
          <button
            className="btn-delete-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setError("Enter username and password");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      onLogin(session);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-wrap">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <header className="login-brand">
        <span className="login-eyebrow">Discipline Tracker</span>
        <h1 className="login-title">
          Control your <em>money.</em>
          <br />
          Control your life.
        </h1>
        <p className="login-sub">
          A focused daily ritual for spending smarter, training consistently,
          and staying in command.
        </p>
      </header>
      <form className="login-card" onSubmit={handleSubmit}>
        <div>
          <p className="field-lbl">Username</p>
          <div className="field-wrap">
            <svg
              className="field-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS.user}
            </svg>
            <input
              className="field-input"
              type="text"
              placeholder="Enter username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <div>
          <p className="field-lbl">Password</p>
          <div className="field-wrap">
            <svg
              className="field-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS.lock}
            </svg>
            <input
              className="field-input"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Let's go →"}
        </button>
        <p className="login-hint">admin / 1234 · session ends on close</p>
      </form>
      <footer className="login-footer">Stay disciplined daily</footer>
    </main>
  );
}

// ─── DatePickerCalendar ───────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function DatePickerCalendar({ value, onChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDate(today);

  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const triggerRef = useRef(null);

  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : today;
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : today;
    return d.getMonth();
  });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const POPUP_WIDTH = 296;
  const POPUP_HEIGHT = 310;

  const isCurrentMonthInFuture =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  function openPicker() {
    if (!triggerRef.current) { setOpen(true); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // prefer above, else below
    let top = rect.top - POPUP_HEIGHT - 8;
    if (top < 8) top = rect.bottom + 8;
    if (top + POPUP_HEIGHT > vh - 8) top = vh - POPUP_HEIGHT - 8;
    // align right edge of popup with right edge of trigger, clamp to vw
    let left = rect.right - POPUP_WIDTH;
    if (left < 8) left = 8;
    if (left + POPUP_WIDTH > vw - 8) left = vw - POPUP_WIDTH - 8;
    setPopupStyle({ top, left });
    setOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonthInFuture) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDate(day) {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d > today) return;
    onChange(formatDate(d));
    setOpen(false);
  }

  const displayLabel = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Select date";

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="datepicker-wrap">
      <button
        ref={triggerRef}
        type="button"
        className="datepicker-trigger"
        onClick={() => open ? setOpen(false) : openPicker()}
      >
        <span>{displayLabel}</span>
        <svg viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div className="datepicker-popup" style={popupStyle}>
            <div className="datepicker-header">
              <button type="button" className="datepicker-nav" onClick={prevMonth}>‹</button>
              <span className="datepicker-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" className="datepicker-nav" onClick={nextMonth} disabled={isCurrentMonthInFuture}>›</button>
            </div>
            <div className="datepicker-dow">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d} className="datepicker-dow-cell">{d}</div>
              ))}
            </div>
            <div className="datepicker-grid">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="dp-cell dp-empty" />;
                const key = formatDate(new Date(viewYear, viewMonth, day));
                const isFuture = new Date(viewYear, viewMonth, day) > today;
                const isSelected = key === value;
                const isToday = key === todayKey;
                return (
                  <div
                    key={day}
                    className={`dp-cell${isFuture ? " dp-future" : ""}${isSelected ? " dp-selected" : ""}${isToday && !isSelected ? " dp-today" : ""}`}
                    onClick={() => !isFuture && selectDate(day)}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({
  dashboard,
  allExpenses,
  amount,
  note,
  category,
  expenseDate,
  setAmount,
  setNote,
  setCategory,
  setExpenseDate,
  addExpense,
  isSyncing,
  onEditExpense,
  onDeleteExpense,
  onExportCSV,
  onDeleteAll,
  installPrompt,
  onInstall,
  notifPermission,
  onRequestNotif,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("today");

  const dailyBudget = Number(dashboard?.dailyBudget || 120);
  const code = dashboard?.currencyCode || "INR";

  // Determine expenses to show based on filter
  const baseExpenses = useMemo(() => {
    const today = getTodayKey();
    const startWeek = getStartOfWeek();
    const startWeekKey = formatDate(startWeek);
    const monthKey = today.slice(0, 7);
    let list = allExpenses;
    if (filterMode === "today") list = allExpenses.filter((e) => e.date === today);
    else if (filterMode === "week") list = allExpenses.filter((e) => e.date >= startWeekKey && e.date <= today);
    else if (filterMode === "month") list = allExpenses.filter((e) => (e.date || "").startsWith(monthKey));
    return list;
  }, [allExpenses, filterMode]);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return baseExpenses;
    const q = searchQuery.toLowerCase();
    return baseExpenses.filter(
      (e) => (e.note || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q),
    );
  }, [baseExpenses, searchQuery]);

  const spent = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const remaining = dailyBudget - (filterMode === "today" ? spent : Number(dashboard?.spent || 0));
  const todaySpent = Number(dashboard?.spent || 0);
  const pct = Math.min((todaySpent / Math.max(dailyBudget, 1)) * 100, 100);
  const tone = todaySpent < dailyBudget ? "success" : todaySpent === dailyBudget ? "warning" : "danger";
  const pillLabel = todaySpent < dailyBudget ? "On track" : todaySpent === dailyBudget ? "Limit hit" : "Overspent";

  const filterLabel = filterMode === "today" ? "Today's log" : filterMode === "week" ? "This week's log" : "This month's log";

  return (
    <div className="tab-panel fade-in">
      {/* Install prompt banner */}
      {installPrompt && (
        <div className="install-banner">
          <div className="install-banner-text">
            <strong>Install App</strong> · Add to home screen for the best experience
          </div>
          <button className="install-btn" onClick={onInstall}>Install</button>
        </div>
      )}

      {/* Notification permission banner */}
      {notifPermission === "default" && (
        <div className="notif-banner">
          <div className="notif-banner-text">
            <strong>Enable Reminders</strong> · Get daily nudges to log expenses & gym
          </div>
          <button className="notif-btn" onClick={onRequestNotif}>Allow</button>
        </div>
      )}

      {/* Hero spend card */}
      <div className={`hero hero-${tone}`}>
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-inner">
          <div className="hero-row">
            <div>
              <p className="hero-eyebrow">Today&apos;s spend</p>
              <p className="hero-amount">{currency(todaySpent, code)}</p>
            </div>
            <span className={`pill pill-${tone}`}>
              <span className="pill-dot" />
              {pillLabel}
            </span>
          </div>
          <div className="hero-metrics">
            <div className="hero-metric">
              <p className="hero-metric-lbl">Remaining</p>
              <p className="hero-metric-val">
                {currency(Math.max(remaining, 0), code)}
              </p>
            </div>
            <div className="hero-metric">
              <p className="hero-metric-lbl">Daily cap</p>
              <p className="hero-metric-val">{currency(dailyBudget, code)}</p>
            </div>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill progress-fill-${tone}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add expense form */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">Quick add</p>
            <p className="card-title">Log expense</p>
          </div>
        </div>
        {/* Quick-add presets */}
        <div className="quick-add-row">
          {QUICK_ADDS.map((qa) => (
            <button
              key={qa.label}
              className="quick-add-btn"
              type="button"
              onClick={() => {
                setAmount(String(qa.amount));
                setNote(qa.note);
                setCategory(qa.category);
              }}
            >
              {qa.label}
            </button>
          ))}
        </div>
        <form className="expense-form" onSubmit={addExpense}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="plain-input"
              style={{ flex: "0 0 120px" }}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="plain-input"
              style={{ flex: 1 }}
              type="text"
              placeholder="What was it for?"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                // Auto-detect category from note
                const detected = detectCategory(e.target.value);
                if (detected !== "general") setCategory(detected);
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <select
              className="plain-input add-select"
              style={{ flex: 1 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <DatePickerCalendar value={expenseDate} onChange={setExpenseDate} />
          </div>
          <button
            className="btn-primary"
            type="submit"
            disabled={isSyncing || !amount}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "none", stroke: "#000", strokeWidth: 2.4, strokeLinecap: "round" }}>
              {ICONS.plus}
            </svg>
            {isSyncing ? "Saving…" : "Add expense"}
          </button>
        </form>
      </div>

      {/* Expense list with filters and search */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">{filterLabel}</p>
            <p className="card-title">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? "entry" : "entries"}
              {filterMode !== "today" && (
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", marginLeft: 8 }}>
                  · {currency(spent, code)}
                </span>
              )}
            </p>
          </div>
          {filteredExpenses.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, paddingTop: 4 }}>
              ← swipe
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {[["today", "Today"], ["week", "This Week"], ["month", "This Month"]].map(([key, label]) => (
            <button
              key={key}
              className={`filter-tab${filterMode === key ? " active" : ""}`}
              onClick={() => setFilterMode(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="search-wrap" style={{ marginTop: 8 }}>
          <svg className="search-icon" viewBox="0 0 24 24">{ICONS.search}</svg>
          <input
            className="search-input"
            type="search"
            placeholder="Search expenses…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Expense list */}
        <div style={{ marginTop: 12 }}>
          {filteredExpenses.length ? (
            <div className="expense-rows">
              {filteredExpenses.map((exp) => (
                <SwipeableExpenseRow
                  key={String(exp.id || exp._id)}
                  exp={exp}
                  code={code}
                  onEdit={onEditExpense}
                  onDelete={onDeleteExpense}
                  showDate={filterMode !== "today"}
                />
              ))}
            </div>
          ) : (
            <div className="empty-box" style={{ border: "0.5px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
              {searchQuery ? "No expenses match your search." : filterMode === "today" ? "No expenses logged today · Keep it intentional 🎯" : filterMode === "week" ? "No expenses this week yet." : "No expenses this month yet."}
            </div>
          )}
        </div>

        {/* Export + Delete All */}
        <div className="action-row" style={{ marginTop: 14 }}>
          <button className="btn-export" onClick={onExportCSV}>
            <svg viewBox="0 0 24 24">{ICONS.download}</svg>
            Export CSV
          </button>
          <button className="btn-danger" onClick={onDeleteAll}>
            <svg viewBox="0 0 24 24">{ICONS.trash}</svg>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab({ statsSummary, weeklySeries, monthlySeries, allExpenses }) {
  const code = statsSummary?.currencyCode || "INR";
  const dailyBudget = Number(statsSummary?.dailyBudget || 120);
  const weeklyBudget = Number(statsSummary?.weeklyBudget || dailyBudget * 7);
  const weeklySpent = Number(statsSummary?.weeklySpent || 0);
  const weeklySaved = Number(statsSummary?.weeklySaved || 0);
  const monthlyBudget = Number(statsSummary?.monthlyBudget || 0);
  const monthlySpent = Number(statsSummary?.monthlySpent || 0);
  const monthlySaved = Number(statsSummary?.monthlySaved || 0);
  const startOfWeek = getStartOfWeek();
  const today = new Date();
  const todayKey = getTodayKey();

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const key = formatDate(d);
    const found = weeklySeries.find((item) => item.date === key);
    return {
      key,
      label: DAY_LABELS[d.getDay()].slice(0, 1),
      total: Number(found?.total || 0),
    };
  });
  const highest = Math.max(...weekDays.map((d) => d.total), dailyBudget, 1);

  // Last week spending for comparison
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(startOfWeek);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  const lastWeekStartKey = formatDate(lastWeekStart);
  const lastWeekEndKey = formatDate(lastWeekEnd);
  const lastWeekSpent = allExpenses
    .filter((e) => e.date >= lastWeekStartKey && e.date <= lastWeekEndKey)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  // Last month spending for comparison
  const thisMonthKey = todayKey.slice(0, 7);
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthKey = formatDate(lastMonthDate).slice(0, 7);
  const lastMonthSpent = allExpenses
    .filter((e) => (e.date || "").startsWith(lastMonthKey))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  // Spending prediction
  const daysElapsed = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyRate = monthlySpent / Math.max(daysElapsed, 1);
  const predictedMonthly = Math.round(dailyRate * daysInMonth);

  // Highest spending day this week
  const highestDay = weekDays.reduce((max, d) => d.total > max.total ? d : max, weekDays[0]);

  // Most-used category
  const monthKey = todayKey.slice(0, 7);
  const monthExpenses = allExpenses.filter((e) => (e.date || "").startsWith(monthKey));

  // Smart insight
  let insight = null;
  if (lastWeekSpent > 0 && weeklySpent > lastWeekSpent * 1.15) {
    insight = { type: "warn", text: `You spent ${currency(weeklySpent - lastWeekSpent, code)} more than last week. Keep an eye on it.` };
  } else if (lastWeekSpent > 0 && weeklySpent < lastWeekSpent * 0.9) {
    insight = { type: "good", text: `Great! You spent ${currency(lastWeekSpent - weeklySpent, code)} less than last week.` };
  } else if (weeklyBudget > 0 && weeklySpent > weeklyBudget) {
    insight = { type: "bad", text: `Over budget by ${currency(weeklySpent - weeklyBudget, code)} this week.` };
  } else if (weeklyBudget > 0 && weeklySpent <= weeklyBudget * 0.75) {
    insight = { type: "good", text: `On track · ${currency(weeklySaved, code)} saved this week so far.` };
  }

  // Category breakdown from allExpenses (this month)
  const catTotals = CATEGORIES.map((cat) => ({
    ...cat,
    total: monthExpenses.filter((e) => (e.category || "general") === cat.value).reduce((s, e) => s + Number(e.amount || 0), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const catGrandTotal = catTotals.reduce((s, c) => s + c.total, 0);

  return (
    <div className="tab-panel fade-in">
      {/* Smart insight */}
      {insight && (
        <div className={`insight-alert insight-alert-${insight.type}`}>
          <svg viewBox="0 0 24 24">{insight.type === "good" ? ICONS.check : ICONS.warning}</svg>
          {insight.text}
        </div>
      )}

      <div className="insight-card">
        <div className="insight-glow" />
        <div className="insight-inner">
          <p className="insight-label">This week</p>
          <p className="insight-title">
            {weeklySaved >= 0 ? `Saved ${currency(weeklySaved, code)}` : `Over by ${currency(Math.abs(weeklySaved), code)}`}
          </p>
          <p className="insight-sub">
            {currency(weeklySpent, code)} spent · {currency(weeklyBudget, code)} planned
            {lastWeekSpent > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                · Last week: {currency(lastWeekSpent, code)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Prediction card */}
      {monthlySpent > 0 && (
        <div className="prediction-card">
          <div className="prediction-icon">
            <svg viewBox="0 0 24 24">{ICONS.target}</svg>
          </div>
          <div className="prediction-body">
            <p className="prediction-lbl">At this rate</p>
            <p className="prediction-val">{currency(predictedMonthly, code)}</p>
            <p className="prediction-sub">
              Projected spend by end of month · {currency(dailyRate, code)}/day avg
              {lastMonthSpent > 0 && ` · Last month: ${currency(lastMonthSpent, code)}`}
            </p>
          </div>
        </div>
      )}

      <div className="metric-row">
        <div className="metric-tile">
          <p className="metric-lbl">Weekly spent</p>
          <p className="metric-val">{currency(weeklySpent, code)}</p>
          <p className="metric-sub">of {currency(weeklyBudget, code)}</p>
        </div>
        <div className="metric-tile">
          <p className="metric-lbl">Monthly saved</p>
          <p className="metric-val">{currency(monthlySaved, code)}</p>
          <p className="metric-sub">of {currency(monthlyBudget, code)} budget</p>
        </div>
      </div>

      {/* Weekly chart with tooltips */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">Weekly graph</p>
            <p className="card-title">Spending rhythm</p>
          </div>
          <span className="pill pill-success" style={{ fontSize: 11 }}>
            {currency(dailyBudget, code)}/day
          </span>
        </div>
        <div className="chart-area">
          {weekDays.map((day) => (
            <div className="chart-col" key={day.key}>
              {day.total > 0 && (
                <div className="chart-tooltip">{currency(day.total, code)}</div>
              )}
              <div
                className={`chart-bar${day.total > dailyBudget ? " chart-bar-hot" : ""}`}
                style={{ height: `${Math.max((day.total / highest) * 100, day.total > 0 ? 8 : 3)}%` }}
              />
              <span className="chart-day-lbl">{day.label}</span>
            </div>
          ))}
        </div>
        {highestDay?.total > 0 && (
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 10 }}>
            Highest day: <strong style={{ color: "var(--text2)" }}>{DAY_LABELS[new Date(highestDay.key + "T00:00:00").getDay()]}</strong> · {currency(highestDay.total, code)}
          </p>
        )}
      </div>

      {/* Budget vs actual + month comparison */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">Comparison</p>
            <p className="card-title">Budget vs actual</p>
          </div>
        </div>
        <div className="comp-row">
          <span className="comp-lbl">Weekly</span>
          <div className="comp-track">
            <div
              className="comp-fill comp-fill-green"
              style={{ width: `${Math.min((weeklySpent / Math.max(weeklyBudget, 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="comp-val">{currency(weeklySpent, code)}</span>
        </div>
        <div className="comp-row">
          <span className="comp-lbl">Monthly</span>
          <div className="comp-track">
            <div
              className="comp-fill comp-fill-yellow"
              style={{ width: `${Math.min((monthlySpent / Math.max(monthlyBudget, 1)) * 100, 100)}%` }}
            />
          </div>
          <span className="comp-val">{currency(monthlySpent, code)}</span>
        </div>
        {lastMonthSpent > 0 && (
          <div className="comp-row">
            <span className="comp-lbl" style={{ color: "var(--text3)" }}>Last month</span>
            <div className="comp-track">
              <div
                className="comp-fill"
                style={{ width: `${Math.min((lastMonthSpent / Math.max(monthlyBudget || lastMonthSpent, 1)) * 100, 100)}%`, background: "rgba(191,90,242,0.5)" }}
              />
            </div>
            <span className="comp-val" style={{ color: "var(--text3)" }}>{currency(lastMonthSpent, code)}</span>
          </div>
        )}
        <p className="comp-note">
          {monthlySeries.length
            ? `${monthlySeries.length} active day${monthlySeries.length > 1 ? "s" : ""} this month.`
            : "No monthly data yet. Start tracking to see insights."}
        </p>
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">This month</p>
              <p className="card-title">Category breakdown</p>
            </div>
          </div>
          {catTotals.map((cat) => (
            <div className="comp-row" key={cat.value}>
              <span className="comp-lbl" style={{ color: cat.color, fontSize: 12, fontWeight: 600 }}>{cat.label}</span>
              <div className="comp-track">
                <div
                  className="comp-fill"
                  style={{ width: `${Math.min((cat.total / Math.max(catGrandTotal, 1)) * 100, 100)}%`, background: cat.color }}
                />
              </div>
              <span className="comp-val">{currency(cat.total, code)}</span>
            </div>
          ))}
          <p className="comp-note">
            Top category: <strong style={{ color: catTotals[0]?.color }}>{catTotals[0]?.label}</strong> · Total: {currency(catGrandTotal, code)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Gym Tab ──────────────────────────────────────────────────────────────────
function GymTab({ gymLogMap, toggleGym, gymSummary, isSyncing }) {
  const [showMonthly, setShowMonthly] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [duration, setDuration] = useState(60);
  const startOfWeek = getStartOfWeek();
  const todayKey = getTodayKey();

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const key = formatDate(d);
    return {
      key,
      label: DAY_LABELS[d.getDay()].slice(0, 3),
      num: d.getDate(),
      done: !!gymLogMap[key],
      today: key === todayKey,
    };
  });

  // Streak: count consecutive days ending today (backwards)
  let streak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  if (!gymLogMap[todayKey]) {
    cur.setDate(cur.getDate() - 1);
  }
  while (gymLogMap[formatDate(cur)]) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  const totalCompletedDays = Object.values(gymLogMap).filter(Boolean).length;
  const weeklyConsistency =
    Number(gymSummary?.weeklyConsistency) ||
    Math.round((weekDates.filter((d) => d.done).length / 7) * 100);
  const todayDone = !!gymLogMap[todayKey];

  // Gym consistency insight
  const weekDone = weekDates.filter((d) => d.done).length;
  const dayOfWeek = new Date().getDay();
  const daysPassed = dayOfWeek === 0 ? 7 : dayOfWeek;
  const consistency = daysPassed > 0 ? weekDone / daysPassed : 0;
  let gymInsight = null;
  if (consistency < 0.4 && daysPassed >= 3) {
    gymInsight = { type: "bad", text: "Consistency dropped. You missed 2+ sessions this week. Get back on track." };
  } else if (streak >= 5) {
    gymInsight = { type: "good", text: `${streak}-day streak! You're building real discipline. Keep going.` };
  } else if (todayDone) {
    gymInsight = { type: "good", text: "Great job logging today's session. Stay consistent!" };
  }

  // Monthly grid
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(new Date(today.getFullYear(), today.getMonth(), d));
    monthCells.push({ date: d, key: dateStr, done: !!gymLogMap[dateStr], today: dateStr === todayKey });
  }

  const monthDoneCount = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = formatDate(new Date(today.getFullYear(), today.getMonth(), i + 1));
    return gymLogMap[dateStr] ? 1 : 0;
  }).reduce((s, v) => s + v, 0);

  function handleToggleToday() {
    if (isSyncing) return;
    toggleGym(todayKey, selectedWorkout, duration);
  }

  return (
    <div className="tab-panel fade-in">
      {/* Insight alert */}
      {gymInsight && (
        <div className={`insight-alert insight-alert-${gymInsight.type}`}>
          <svg viewBox="0 0 24 24">{gymInsight.type === "good" ? ICONS.check : ICONS.warning}</svg>
          {gymInsight.text}
        </div>
      )}

      {/* Hero card */}
      <div className="gym-hero">
        <div className="gym-hero-glow" />
        <div className="gym-inner">
          <div className="gym-row">
            <div>
              <p className="hero-eyebrow">Daily ritual</p>
              <p className="hero-amount" style={{ fontSize: 36 }}>6–7 AM Gym</p>
            </div>
            <div className="ios-toggle-wrap">
              <div
                className={`ios-toggle${todayDone ? " on" : ""}`}
                onClick={handleToggleToday}
                role="switch"
                aria-checked={todayDone}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleToggleToday()}
              >
                <div className="ios-toggle-thumb" />
              </div>
              <span className="ios-toggle-lbl">
                {isSyncing ? "Saving…" : todayDone ? "Done ✓" : "Log it"}
              </span>
            </div>
          </div>

          {/* Workout type + duration (only when not done) */}
          {!todayDone && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(48,209,88,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Workout type</p>
              <div className="workout-chips">
                {WORKOUT_TYPES.map((wt) => (
                  <button
                    key={wt.value}
                    type="button"
                    className={`workout-chip${selectedWorkout === wt.value ? " active" : ""}`}
                    onClick={() => setSelectedWorkout(wt.value)}
                  >
                    {wt.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(48,209,88,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Duration</p>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "var(--green)" }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", minWidth: 44, textAlign: "right" }}>{duration}m</span>
              </div>
            </div>
          )}

          {todayDone && (
            <p style={{ marginTop: 12, fontSize: 12, color: "rgba(48,209,88,0.6)" }}>
              Session logged · Tap toggle to undo
            </p>
          )}

          <div className="hero-metrics" style={{ marginTop: 16 }}>
            <div className="hero-metric">
              <p className="hero-metric-lbl">Streak</p>
              <p className="hero-metric-val">{streak} {streak === 1 ? "day" : "days"} 🔥</p>
            </div>
            <div className="hero-metric">
              <p className="hero-metric-lbl">This week</p>
              <p className="hero-metric-val">{weeklyConsistency}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="metric-row">
        <div className="metric-tile">
          <p className="metric-lbl">Total sessions</p>
          <p className="metric-val">{totalCompletedDays}</p>
          <p className="metric-sub">all time</p>
        </div>
        <div className="metric-tile">
          <p className="metric-lbl">This month</p>
          <p className="metric-val">{monthDoneCount}</p>
          <p className="metric-sub">of {today.getDate()} days</p>
        </div>
      </div>

      <div className="gym-motive">
        🎯{" "}
        {streak > 0
          ? `${streak}-day streak. Every early session compounds. Protect the habit.`
          : "Start today. The hardest rep is showing up. Make it count."}
      </div>

      {/* Weekly / Monthly toggle */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">{showMonthly ? "This month" : "This week"}</p>
            <p className="card-title">Consistency view</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pill pill-success">
              {showMonthly ? `${monthDoneCount}/${today.getDate()}` : `${weekDates.filter((d) => d.done).length}/7`} days
            </span>
            <button
              onClick={() => setShowMonthly((v) => !v)}
              style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", background: "rgba(255,255,255,0.05)", border: "0.5px solid var(--border2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}
            >
              {showMonthly ? "Week" : "Month"}
            </button>
          </div>
        </div>

        {showMonthly ? (
          <div>
            <div className="month-grid" style={{ marginBottom: 4 }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d} className="month-day-header">{d}</div>
              ))}
            </div>
            <div className="month-grid">
              {monthCells.map((cell, idx) =>
                cell === null ? (
                  <div key={`empty-${idx}`} />
                ) : (
                  <button
                    key={cell.key}
                    type="button"
                    className={`month-cell${cell.done ? " month-cell-done" : " month-cell-empty"}${cell.today ? " month-cell-today" : ""}`}
                    onClick={() => !isSyncing && toggleGym(cell.key)}
                    disabled={isSyncing || cell.key > todayKey}
                    title={cell.key}
                  >
                    {cell.done ? "✓" : cell.date}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="cal-grid">
            {weekDates.map((day) => (
              <button
                key={day.key}
                type="button"
                className={`cal-day${day.done ? " done" : ""}${day.today ? " today" : ""}`}
                onClick={() => !isSyncing && toggleGym(day.key)}
                disabled={isSyncing}
              >
                <span className="cal-lbl">{day.label}</span>
                <span className="cal-num">{day.num}</span>
                <span className="cal-check">{day.done ? "✓" : "○"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Button (Topbar) ──────────────────────────────────────────────────
function ProfileButton({ currentUser, profileImg, onClickUpload }) {
  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <button
      className="topbar-profile-btn"
      onClick={onClickUpload}
      title="Click to change profile picture"
    >
      {profileImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImg}
          alt="Profile"
          className="topbar-profile-img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/myprofile.png";
          }}
        />
      ) : (
        <span className="topbar-profile-initials">{initials}</span>
      )}
    </button>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({
  statsSummary,
  gymLogMap,
  gymSummary,
  onLogout,
  onDeleteAll,
  onUpdateBudget,
  currentUser,
  profileImg,
  onClickUpload,
  profileUploading,
}) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthPrefix = formatDate(today).slice(0, 7);
  const code = statsSummary?.currencyCode || "INR";
  const monthlyBudget = Number(statsSummary?.monthlyBudget || 0);
  const monthlySpent = Number(statsSummary?.monthlySpent || 0);
  const monthlySaved = Number(statsSummary?.monthlySaved || 0);
  const currentDailyBudget = Number(statsSummary?.dailyBudget || 120);
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(currentDailyBudget));
  const [budgetSaving, setBudgetSaving] = useState(false);

  async function saveBudget() {
    const val = Number(budgetInput);
    if (!val || val <= 0) return;
    setBudgetSaving(true);
    await onUpdateBudget(val);
    setBudgetSaving(false);
    setBudgetEdit(false);
  }
  const weeklySpent = Number(statsSummary?.weeklySpent || 0);
  const gymDays = Object.entries(gymLogMap).filter(
    ([k, v]) => v && k.startsWith(monthPrefix),
  ).length;
  const gymScore = Math.min(
    Math.round((gymDays / Math.max(dayOfMonth, 1)) * 100),
    100,
  );
  const moneyScore = Math.max(
    100 - Math.round((monthlySpent / Math.max(monthlyBudget, 1)) * 100),
    0,
  );
  const score = Math.round((gymScore + moneyScore) / 2);
  const trending = score >= 70;
  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="tab-panel fade-in">
      {/* Profile photo section */}
      <div className="profile-photo-section">
        <div
          className="profile-photo-ring"
          onClick={onClickUpload}
          title="Tap to change photo"
        >
          {profileImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileImg}
              alt="Profile"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/myprofile.png";
              }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="profile-photo-initials-big">{initials}</div>
          )}
          <div className="profile-photo-camera">
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 13,
                height: 13,
                fill: "none",
                stroke: "#000",
                strokeWidth: 2,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              }}
            >
              {ICONS.camera}
            </svg>
          </div>
        </div>
        <p className="profile-photo-name">{currentUser?.name || "Subrat"}</p>
        <p className="profile-photo-username">
          @{currentUser?.username || "subrat"}
        </p>
        {profileUploading && (
          <p style={{ fontSize: 12, color: "var(--text3)" }}>Uploading…</p>
        )}
      </div>

      <div className="profile-score-card">
        <div className="profile-score-glow" />
        <div className="profile-score-inner">
          <p className="profile-score-lbl">Performance score</p>
          <p className="profile-score">
            {score}
            <sub>/100</sub>
          </p>
          <div className="profile-trend">
            {trending ? "↑ Improving" : "↓ Needs focus"}
          </div>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-tile">
          <p className="metric-lbl">Weekly spend</p>
          <p className="metric-val">{currency(weeklySpent, code)}</p>
        </div>
        <div className="metric-tile">
          <p className="metric-lbl">Monthly saved</p>
          <p className="metric-val">{currency(monthlySaved, code)}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">This month</p>
            <p className="card-title">Discipline breakdown</p>
          </div>
        </div>
        <div className="stat-list">
          <div className="stat-row">
            <span className="stat-name">Money score</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="stat-val">{moneyScore}/100</span>
              <span
                className={`stat-badge ${moneyScore >= 60 ? "stat-badge-good" : "stat-badge-warn"}`}
              >
                {moneyScore >= 60 ? "Stable" : "At risk"}
              </span>
            </div>
          </div>
          <div className="stat-row">
            <span className="stat-name">Gym score</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="stat-val">{gymScore}/100</span>
              <span
                className={`stat-badge ${gymScore >= 60 ? "stat-badge-good" : "stat-badge-warn"}`}
              >
                {gymScore >= 60 ? "Strong" : "Build up"}
              </span>
            </div>
          </div>
          <div className="stat-row">
            <span className="stat-name">Sessions this month</span>
            <span className="stat-val">
              {gymSummary?.completedDays || gymDays} sessions
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-name">Budget used</span>
            <span className="stat-val">
              {currency(monthlySpent, code)} / {currency(monthlyBudget, code)}
            </span>
          </div>
        </div>
      </div>

      {/* Daily budget editor */}
      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">Daily limit</p>
            <p className="card-title">Daily Budget</p>
          </div>
          {!budgetEdit && (
            <button
              onClick={() => { setBudgetInput(String(currentDailyBudget)); setBudgetEdit(true); }}
              style={{ height: 32, padding: "0 14px", borderRadius: "var(--r-pill)", background: "rgba(10,132,255,0.1)", border: "0.5px solid rgba(10,132,255,0.25)", color: "var(--blue)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Edit
            </button>
          )}
        </div>
        {budgetEdit ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
            <input
              className="plain-input"
              type="number"
              min="1"
              style={{ flex: 1 }}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveBudget()}
              autoFocus
            />
            <button
              onClick={saveBudget}
              disabled={budgetSaving}
              style={{ height: 44, padding: "0 18px", borderRadius: "var(--r-pill)", background: "var(--green)", border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {budgetSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setBudgetEdit(false)}
              style={{ height: 44, padding: "0 14px", borderRadius: "var(--r-pill)", background: "rgba(255,255,255,0.06)", border: "0.5px solid var(--border2)", color: "var(--text2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <p style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em", marginTop: 6 }}>
            {currency(currentDailyBudget, code)}
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text3)", marginLeft: 6 }}>/ day</span>
          </p>
        )}
      </div>

      {/* Daily quote */}
      <QuoteCard />

      <button className="btn-clear-all" onClick={onDeleteAll}>
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
          {ICONS.trash}
        </svg>
        Clear all data
      </button>
      <button className="btn-logout" onClick={onLogout}>
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
          {ICONS.logout}
        </svg>
        Sign out
      </button>
    </div>
  );
}

// ─── Quote Card ───────────────────────────────────────────────────────────────
function QuoteCard() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const quote = QUOTES[idx];
  function refresh() {
    setIdx((prev) => {
      let next = Math.floor(Math.random() * QUOTES.length);
      if (next === prev) next = (prev + 1) % QUOTES.length;
      return next;
    });
  }
  return (
    <div className="quote-card">
      <button className="quote-refresh-btn" onClick={refresh} title="New quote">
        <svg viewBox="0 0 24 24">{ICONS.refresh}</svg>
      </button>
      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "none", stroke: "rgba(191,90,242,0.4)", strokeWidth: 1.5, strokeLinecap: "round", marginBottom: 8 }}>
        {ICONS.quote}
      </svg>
      <p className="quote-text">&ldquo;{quote.text}&rdquo;</p>
      <p className="quote-author">— {quote.author}</p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AppShell() {
  const [booted, setBooted] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("general");
  const [expenseDate, setExpenseDate] = useState(() => getTodayKey());
  const [now, setNow] = useState(() => new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
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
  const [allExpenses, setAllExpenses] = useState([]);
  const [gymLogs, setGymLogs] = useState([]);
  const [gymSummary, setGymSummary] = useState({
    completedDays: 0,
    weeklyConsistency: 0,
    logs: [],
  });

  // Profile picture state
  const [profileImg, setProfileImg] = useState(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Edit/Delete state
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [isModalDeleting, setIsModalDeleting] = useState(false);

  const gymLogMap = useMemo(
    () =>
      Object.fromEntries(
        gymLogs.map((l) => [normalizeApiDate(l.date), Boolean(l.completed)]),
      ),
    [gymLogs],
  );

  const handleSessionExpired = useCallback((msg) => {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    setAuthToken("");
    setCurrentUser(null);
    setActiveTab("home");
    setErrorMessage(msg || "Session expired. Please log in again.");
  }, []);

  // Load profile image from localStorage whenever user changes
  useEffect(() => {
    if (!currentUser?.id) return;
    const saved = window.localStorage.getItem(`profile_img_${currentUser.id}`);
    if (saved) {
      setProfileImg(buildAssetUrl(saved));
    } else if (currentUser.profileImage) {
      setProfileImg(buildAssetUrl(currentUser.profileImage));
    } else {
      setProfileImg("/myprofile.png");
    }
  }, [currentUser?.id, currentUser?.profileImage]);

  // Load install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function requestNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  const loadAppData = useCallback(async () => {
    setIsSyncing(true);
    setErrorMessage("");
    try {
      const today = getTodayKey();
      const monthStart = today.slice(0, 7) + "-01";
      const lastMonthDate = new Date();
      lastMonthDate.setDate(1);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthStart = formatDate(lastMonthDate).slice(0, 7) + "-01";

      const [dash, stats, weekly, monthly, gyms, gymSum, monthExpenses, lastMonthExpenses] = await Promise.all([
        fetchJson("/api/dashboard/today", {}, authToken),
        fetchJson("/api/stats/summary", {}, authToken),
        fetchJson("/api/stats/weekly", {}, authToken),
        fetchJson("/api/stats/monthly", {}, authToken),
        fetchJson("/api/gym", {}, authToken),
        fetchJson("/api/gym/summary", {}, authToken),
        fetchJson(`/api/expenses?startDate=${monthStart}&endDate=${today}`, {}, authToken).catch(() => []),
        fetchJson(`/api/expenses?startDate=${lastMonthStart}&endDate=${today.slice(0, 7) + "-01"}`, {}, authToken).catch(() => []),
      ]);
      setDashboard(dash);
      setStatsSummary(stats);
      setWeeklySeries(weekly);
      setMonthlySeries(monthly);
      setGymLogs(gyms);
      setGymSummary(gymSum);
      // Combine this month + last month for filtering (deduplicate by id)
      const combined = [...(monthExpenses || []), ...(lastMonthExpenses || [])];
      const seen = new Set();
      const deduped = combined.filter((e) => {
        const id = e.id || e._id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setAllExpenses(deduped);
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired(err.message);
        return;
      }
      setErrorMessage(err.message || "Failed to load data from backend.");
    } finally {
      setIsSyncing(false);
    }
  }, [authToken, handleSessionExpired]);

  useEffect(() => {
    const tok = window.sessionStorage.getItem(TOKEN_KEY);
    const usr = window.sessionStorage.getItem(USER_KEY);
    if (!tok) {
      setBooted(true);
      return;
    }
    fetchJson("/api/auth/session", {}, tok)
      .then((p) => {
        setAuthToken(tok);
        setCurrentUser(p.user || (usr ? JSON.parse(usr) : null));
        if (p.user) {
          window.sessionStorage.setItem(USER_KEY, JSON.stringify(p.user));
        }
      })
      .catch(() => {
        window.sessionStorage.removeItem(TOKEN_KEY);
        window.sessionStorage.removeItem(USER_KEY);
      })
      .finally(() => setBooted(true));
  }, []);

  useEffect(() => {
    if (booted && authToken) loadAppData();
  }, [booted, authToken, loadAppData]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  function handleLogin(session) {
    window.sessionStorage.setItem(TOKEN_KEY, session.token);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setAuthToken(session.token);
    setCurrentUser(session.user);
    setErrorMessage("");
    setActiveTab("home");
  }

  function clearSession(msg = "") {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    setAuthToken("");
    setCurrentUser(null);
    setActiveTab("home");
    setErrorMessage(msg);
  }

  async function handleLogout() {
    try {
      if (authToken)
        await fetchJson("/api/auth/logout", { method: "POST" }, authToken);
    } catch (_) {
    } finally {
      clearSession("");
    }
  }

  function handleExportCSV() {
    const expenses = allExpenses.length ? allExpenses : (dashboard?.expenses || []);
    if (!expenses.length) return;
    const code = dashboard?.currencyCode || "INR";
    const header = ["Date", "Amount", "Category", "Note"];
    const rows = expenses.map((e) => [
      e.date || "",
      e.amount || 0,
      e.category || "general",
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${getTodayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUpdateBudget(dailyBudget) {
    try {
      await fetchJson(
        "/api/settings",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dailyBudget }),
        },
        authToken,
      );
      await loadAppData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to update budget.");
    }
  }

  function handleDeleteAllRequest() {
    setShowDeleteAllConfirm(true);
  }

  async function handleDeleteAllConfirm() {
    setShowDeleteAllConfirm(false);
    setIsSyncing(true);
    setErrorMessage("");
    try {
      const expenses = allExpenses.length ? allExpenses : (dashboard?.expenses || []);
      const ids = expenses.map((e) => e.id || e._id).filter(Boolean);
      if (ids.length) {
        await fetchJson(
          "/api/expenses/bulk-delete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          },
          authToken,
        );
      }
      await loadAppData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete expenses.");
      setIsSyncing(false);
    }
  }

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }

  async function addExpense(e) {
    if (e) e.preventDefault();
    const num = Number(amount);
    if (!num) return;
    setIsSyncing(true);
    setErrorMessage("");
    try {
      await fetchJson(
        "/api/expenses",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: num,
            note: note.trim(),
            category: expenseCategory || "general",
            date: expenseDate || getTodayKey(),
          }),
        },
        authToken,
      );
      setAmount("");
      setNote("");
      setExpenseCategory("general");
      setExpenseDate(getTodayKey());
      await loadAppData();
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired(err.message);
        return;
      }
      setErrorMessage(err.message || "Failed to save expense.");
      setIsSyncing(false);
    }
  }

  async function handleSaveEdit(updatedExp) {
    setIsModalSaving(true);
    try {
      const id = updatedExp.id || updatedExp._id;
      await fetchJson(
        `/api/expenses/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: updatedExp.amount,
            note: updatedExp.note,
            category: updatedExp.category || "general",
            date: updatedExp.date || getTodayKey(),
          }),
        },
        authToken,
      );
      setEditingExpense(null);
      await loadAppData();
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired(err.message);
        return;
      }
      setErrorMessage(err.message || "Failed to update expense.");
    } finally {
      setIsModalSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingExpense) return;
    setIsModalDeleting(true);
    try {
      const id = deletingExpense.id || deletingExpense._id;
      await fetchJson(`/api/expenses/${id}`, { method: "DELETE" }, authToken);
      setDeletingExpense(null);
      await loadAppData();
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired(err.message);
        return;
      }
      setErrorMessage(err.message || "Failed to delete expense.");
    } finally {
      setIsModalDeleting(false);
    }
  }

  async function toggleGym(dateKey, wType = "", dur = 0) {
    setIsSyncing(true);
    setErrorMessage("");
    try {
      await fetchJson(
        "/api/gym",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateKey,
            completed: !gymLogMap[dateKey],
            sessionLabel: "6-7 AM Gym",
            notes: "",
            workoutType: wType,
            duration: dur,
          }),
        },
        authToken,
      );
      await loadAppData();
    } catch (err) {
      if (err.status === 401) {
        handleSessionExpired(err.message);
        return;
      }
      setErrorMessage(err.message || "Failed to update gym log.");
      setIsSyncing(false);
    }
  }

  // ── Profile upload ──
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileUploading(true);
    try {
      // Read file as base64 and store locally for instant display
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setProfileImg(dataUrl);
        if (currentUser?.id) {
          window.localStorage.setItem(`profile_img_${currentUser.id}`, dataUrl);
        }
      };
      reader.readAsDataURL(file);

      // Also try uploading to server (best-effort)
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", currentUser?.id || "");
        const response = await fetch(`${API_BASE_URL}/api/upload/profile`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl) {
            const resolvedImageUrl = buildAssetUrl(data.imageUrl);
            setProfileImg(resolvedImageUrl);
            setCurrentUser((prev) =>
              prev
                ? {
                    ...prev,
                    profileImage: data.imageUrl,
                  }
                : prev,
            );
            if (currentUser?.id) {
              window.localStorage.setItem(
                `profile_img_${currentUser.id}`,
                resolvedImageUrl,
              );
            }
            const savedUser = window.sessionStorage.getItem(USER_KEY);
            if (savedUser) {
              try {
                const parsedUser = JSON.parse(savedUser);
                window.sessionStorage.setItem(
                  USER_KEY,
                  JSON.stringify({
                    ...parsedUser,
                    profileImage: data.imageUrl,
                  }),
                );
              } catch (_error) {
                // Ignore malformed session payload.
              }
            }
          }
        }
      } catch (_) {
        // Server upload failed, but local display already works
      }
    } finally {
      setProfileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleProfileUploadClick() {
    fileInputRef.current?.click();
  }

  if (!booted)
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <main className="ls-wrap">
          <div className="ls-ring" />
          <p className="ls-label">Preparing dashboard…</p>
        </main>
      </>
    );

  if (!authToken)
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <PwaRegister />
        <LoginScreen onLogin={handleLogin} />
      </>
    );

  const NAV = [
    { tab: "home", icon: "home", label: "Home" },
    { tab: "stats", icon: "stats", label: "Stats" },
    { tab: "gym", icon: "gym", label: "Gym" },
    { tab: "profile", icon: "profile", label: "Profile" },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <PwaRegister />

      {/* Hidden file input for profile upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="profile-upload-input"
        onChange={handleFileChange}
        disabled={profileUploading}
      />

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={handleSaveEdit}
          onClose={() => setEditingExpense(null)}
          isSaving={isModalSaving}
        />
      )}

      {/* Delete Confirm */}
      {deletingExpense && (
        <DeleteConfirmModal
          expense={deletingExpense}
          code={dashboard?.currencyCode || "INR"}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingExpense(null)}
          isDeleting={isModalDeleting}
        />
      )}

      <main className="shell">
        <header className="topbar">
          <div className="topbar-left">
            <p className="topbar-greeting">{getGreeting(now)}</p>
            <h1 className="topbar-name">{currentUser?.name || "Subrat"}</h1>
            <div className="topbar-date">
              <span className="topbar-date-tag">Today</span>
              <span className="topbar-date-text">{formatDisplayDate(now)}</span>
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
          >
            <div className="topbar-budget-pill">
              <span className="topbar-budget-dot" />
              <span className="topbar-budget-text">
                {currency(
                  dashboard?.dailyBudget || statsSummary?.dailyBudget || 120,
                  dashboard?.currencyCode || "INR",
                )}
                /day
              </span>
            </div>
            <ProfileButton
              currentUser={currentUser}
              profileImg={profileImg}
              onClickUpload={handleProfileUploadClick}
            />
          </div>
        </header>

        <section className="content">
          {errorMessage && (
            <div className="error-banner" role="alert">
              {errorMessage}
            </div>
          )}
          {activeTab === "home" && (
            <HomeTab
              dashboard={dashboard}
              allExpenses={allExpenses}
              amount={amount}
              note={note}
              category={expenseCategory}
              expenseDate={expenseDate}
              setAmount={setAmount}
              setNote={setNote}
              setCategory={setExpenseCategory}
              setExpenseDate={setExpenseDate}
              addExpense={addExpense}
              isSyncing={isSyncing}
              onEditExpense={setEditingExpense}
              onDeleteExpense={setDeletingExpense}
              onExportCSV={handleExportCSV}
              onDeleteAll={handleDeleteAllRequest}
              installPrompt={installPrompt}
              onInstall={handleInstall}
              notifPermission={notifPermission}
              onRequestNotif={requestNotifications}
            />
          )}
          {activeTab === "stats" && (
            <StatsTab
              statsSummary={statsSummary}
              weeklySeries={weeklySeries}
              monthlySeries={monthlySeries}
              allExpenses={allExpenses}
            />
          )}
          {activeTab === "gym" && (
            <GymTab
              gymLogMap={gymLogMap}
              toggleGym={toggleGym}
              gymSummary={gymSummary}
              isSyncing={isSyncing}
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab
              statsSummary={statsSummary}
              gymLogMap={gymLogMap}
              gymSummary={gymSummary}
              onLogout={handleLogout}
              currentUser={currentUser}
              profileImg={profileImg}
              onClickUpload={handleProfileUploadClick}
              profileUploading={profileUploading}
              onDeleteAll={handleDeleteAllRequest}
              onUpdateBudget={handleUpdateBudget}
            />
          )}
        </section>

        <nav className="bottom-nav" aria-label="Primary navigation">
          {NAV.map(({ tab, icon, label }) => (
            <button
              key={tab}
              type="button"
              className={`nav-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
            >
              <Icon name={icon} />
              <span className="nav-btn-label">{label}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* Delete-all confirm overlay */}
      {showDeleteAllConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteAllConfirm(false)}>
          <div className="delete-confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, fill: "none", stroke: "var(--red)", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
                {ICONS.trash}
              </svg>
            </div>
            <p className="delete-confirm-title">Delete all expenses?</p>
            <p className="delete-confirm-sub">
              This will permanently remove all {allExpenses.length} expense records. This cannot be undone.
            </p>
            <div className="delete-confirm-actions">
              <button className="btn-delete-cancel" onClick={() => setShowDeleteAllConfirm(false)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={handleDeleteAllConfirm}>Delete all</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

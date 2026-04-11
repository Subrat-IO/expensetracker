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
};

// ─── Global styles injected once ─────────────────────────────────────────────
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

  /* ── Loading ── */
  .ls-wrap {
    display: grid; place-items: center; gap: 24px; text-align: center;
    min-height: 100vh; background: #000;
  }
  .ls-ring {
    width: 60px; height: 60px; border-radius: 50%;
    border: 2.5px solid rgba(48,209,88,0.12);
    border-top-color: var(--green);
    animation: spin 1.2s linear infinite;
  }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .ls-label {
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3);
  }

  /* ── Login ── */
  .login-wrap {
    min-height: 100vh; width: 100vw;
    padding: calc(var(--safe-top) + 48px) 24px calc(var(--safe-bottom) + 48px);
    background: #000;
    display: flex; flex-direction: column; justify-content: center; gap: 40px;
    position: relative; overflow: hidden;
  }
  .login-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
  }
  .login-orb-1 {
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(48,209,88,0.18) 0%, transparent 70%);
    top: -80px; right: -80px; blur-radius: 80px;
  }
  .login-orb-2 {
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(10,132,255,0.12) 0%, transparent 70%);
    bottom: 60px; left: -80px;
  }
  .login-brand {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; gap: 12px;
  }
  .login-eyebrow {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; color: var(--green);
  }
  .login-title {
    font-size: clamp(2.4rem, 10vw, 3.6rem);
    font-weight: 800; line-height: 1.0; letter-spacing: -0.03em; color: var(--text);
    -webkit-font-smoothing: antialiased;
  }
  .login-title em { font-style: normal; color: var(--green); }
  .login-sub { font-size: 15px; color: var(--text2); line-height: 1.6; max-width: 320px; }

  .login-card {
    position: relative; z-index: 1;
    background: var(--s1);
    border: 0.5px solid var(--border3);
    border-radius: var(--r-2xl);
    padding: 28px 24px;
    display: flex; flex-direction: column; gap: 18px;
    animation: slideUp 500ms cubic-bezier(0.22,1,0.36,1) both;
    animation-delay: 120ms;
    backdrop-filter: blur(20px);
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  .field-lbl {
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text3); margin-bottom: 8px;
  }
  .field-wrap { position: relative; }
  .field-icon {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    width: 18px; height: 18px; opacity: 0.35; pointer-events: none;
  }
  .field-input {
    height: 52px; width: 100%;
    padding: 0 16px 0 48px;
    background: rgba(255,255,255,0.06);
    border: 0.5px solid var(--border2);
    border-radius: var(--r-md);
    color: var(--text); font-size: 16px; font-weight: 400;
    transition: border-color 160ms, box-shadow 160ms, background 160ms;
    letter-spacing: -0.01em;
  }
  .field-input::placeholder { color: var(--text3); }
  .field-input:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(48,209,88,0.16), inset 0 0 0 0.5px var(--green);
    background: rgba(255,255,255,0.08);
  }
  .login-error {
    padding: 14px 16px; border-radius: var(--r-sm);
    background: rgba(255,69,58,0.13); border: 0.5px solid rgba(255,69,58,0.28);
    color: var(--red); font-size: 14px; font-weight: 500;
  }
  .btn-primary {
    height: 56px; border-radius: var(--r-pill);
    background: var(--green); color: #000;
    font-size: 15px; font-weight: 700; letter-spacing: 0.01em;
    box-shadow: 0 0 28px rgba(48,209,88,0.32);
    transition: transform var(--transition), box-shadow var(--transition), opacity 140ms;
    width: 100%;
    border: none; cursor: pointer;
  }
  .btn-primary:active { transform: scale(0.96); opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.48; cursor: not-allowed; }
  .login-hint {
    text-align: center; font-size: 12px; color: var(--text3); font-weight: 400;
  }
  .login-footer {
    position: relative; z-index: 1; text-align: center;
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3);
  }

  /* ── App Shell ── */
  .shell {
    width: 100vw; height: 100vh; display: flex; flex-direction: column;
    background: #000; overflow: hidden;
    padding-top: calc(var(--safe-top) + 8px);
    padding-bottom: var(--safe-bottom);
  }

  /* ── Topbar ── */
  .topbar {
    padding: 18px 22px 16px;
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px;
  }
  .topbar-left { flex: 1; min-width: 0; }
  .topbar-greeting {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--green);
    margin-bottom: 4px;
  }
  .topbar-name {
    font-size: clamp(1.8rem, 6vw, 2.4rem);
    font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    -webkit-font-smoothing: antialiased;
  }
  .topbar-date {
    margin-top: 10px;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: var(--r-sm);
    background: rgba(48,209,88,0.1); border: 0.5px solid rgba(48,209,88,0.2);
  }
  .topbar-date-tag {
    height: 22px; padding: 0 9px; border-radius: var(--r-pill);
    background: var(--green); color: #000;
    font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    display: flex; align-items: center;
  }
  .topbar-date-text { font-size: 13px; font-weight: 500; color: var(--text2); }

  .topbar-budget-pill {
    height: 38px; padding: 0 14px; border-radius: var(--r-pill);
    background: rgba(48,209,88,0.08); border: 0.5px solid rgba(48,209,88,0.2);
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  }
  .topbar-budget-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--green);
    box-shadow: 0 0 8px var(--green);
  }
  .topbar-budget-text {
    font-size: 13px; font-weight: 700;
    color: var(--text); letter-spacing: -0.01em;
  }

  .topbar-profile-btn {
    width: 44px; height: 44px; border-radius: var(--r-pill);
    background: rgba(48,209,88,0.1); border: 1.5px solid rgba(48,209,88,0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; cursor: pointer;
    transition: background var(--transition), border-color var(--transition), transform 120ms ease;
    position: relative; overflow: hidden;
  }
  .topbar-profile-btn:hover { background: rgba(48,209,88,0.15); border-color: rgba(48,209,88,0.4); }
  .topbar-profile-btn:active { transform: scale(0.95); }
  
  .topbar-profile-img {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; background: rgba(255,255,255,0.05);
  }
  
  .topbar-profile-initials {
    font-size: 14px; font-weight: 700; color: var(--green);
    letter-spacing: -0.02em;
  }
  
  .profile-upload-input {
    display: none;
  }

  /* ── Content ── */
  .content {
    flex: 1; overflow-y: auto; padding: 4px 18px 140px;
    scrollbar-width: none;
  }
  .content::-webkit-scrollbar { display: none; }

  /* ── Error Banner ── */
  .error-banner {
    margin-bottom: 16px; padding: 14px 16px; border-radius: var(--r-md);
    background: rgba(255,69,58,0.11); border: 0.5px solid rgba(255,69,58,0.24);
    color: var(--red); font-size: 14px; font-weight: 500;
  }

  /* ── Tab Panel ── */
  .tab-panel { display: flex; flex-direction: column; gap: 16px; }

  /* ── Hero Card ── */
  .hero {
    border-radius: var(--r-2xl); padding: 26px 22px;
    position: relative; overflow: hidden;
    border: 0.5px solid transparent;
    backdrop-filter: blur(10px);
  }
  .hero-success {
    background: linear-gradient(145deg, #0b1f10 0%, #060e09 100%);
    border-color: rgba(48,209,88,0.22);
  }
  .hero-warning {
    background: linear-gradient(145deg, #1a1500 0%, #0e0b00 100%);
    border-color: rgba(255,214,10,0.22);
  }
  .hero-danger {
    background: linear-gradient(145deg, #1f0a09 0%, #0e0504 100%);
    border-color: rgba(255,69,58,0.22);
  }
  .hero-glow {
    position: absolute; border-radius: 50%; pointer-events: none;
  }
  .hero-glow-1 {
    width: 220px; height: 220px;
    top: -70px; right: -50px;
    background: radial-gradient(circle, rgba(48,209,88,0.22), transparent 70%);
  }
  .hero-glow-2 {
    width: 160px; height: 160px;
    bottom: -40px; left: -20px;
    background: radial-gradient(circle, rgba(255,214,10,0.1), transparent 70%);
  }
  .hero-warning .hero-glow-1 { background: radial-gradient(circle, rgba(255,214,10,0.22), transparent 70%); }
  .hero-danger  .hero-glow-1 { background: radial-gradient(circle, rgba(255,69,58,0.22), transparent 70%); }

  .hero-inner { position: relative; z-index: 1; }
  .hero-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .hero-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--green); margin-bottom: 6px;
  }
  .hero-warning .hero-eyebrow { color: var(--yellow); }
  .hero-danger  .hero-eyebrow { color: var(--red); }

  .hero-amount {
    font-size: 44px; font-weight: 800;
    letter-spacing: -0.05em; line-height: 1; color: var(--text);
  }

  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    height: 30px; padding: 0 12px; border-radius: var(--r-pill);
    font-size: 12px; font-weight: 600; flex-shrink: 0;
  }
  .pill-success { background: rgba(48,209,88,0.15); color: var(--green); border: 0.5px solid rgba(48,209,88,0.25); }
  .pill-warning { background: rgba(255,214,10,0.15); color: var(--yellow); border: 0.5px solid rgba(255,214,10,0.25); }
  .pill-danger  { background: rgba(255,69,58,0.15);  color: var(--red);   border: 0.5px solid rgba(255,69,58,0.25); }
  .pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  .hero-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
  .hero-metric {
    background: rgba(255,255,255,0.06); border: 0.5px solid var(--border);
    border-radius: var(--r-md); padding: 14px 12px;
  }
  .hero-metric-lbl { font-size: 11px; color: var(--text3); font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
  .hero-metric-val {
    font-size: 20px; font-weight: 700;
    letter-spacing: -0.03em; color: var(--text);
  }

  .progress-track {
    width: 100%; height: 4px; border-radius: var(--r-pill);
    background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 20px;
  }
  .progress-fill { height: 100%; border-radius: inherit; transition: width 600ms cubic-bezier(0.22,1,0.36,1); }
  .progress-fill-success { background: linear-gradient(90deg, var(--green2), var(--green)); }
  .progress-fill-warning  { background: linear-gradient(90deg, #9a8000, var(--yellow)); }
  .progress-fill-danger   { background: linear-gradient(90deg, #a01c18, var(--red)); }

  /* ── Panel Card ── */
  .card {
    background: var(--s1); border: 0.5px solid var(--border2);
    border-radius: var(--r-xl); padding: 20px 18px;
  }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
  .card-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text3); margin-bottom: 4px;
  }
  .card-title {
    font-size: 17px; font-weight: 700;
    letter-spacing: -0.02em; color: var(--text);
  }

  /* ── Add Expense Form ── */
  .expense-form { display: flex; flex-direction: column; gap: 12px; }
  .plain-input {
    height: 52px; width: 100%; padding: 0 16px;
    background: rgba(255,255,255,0.04); border: 0.5px solid var(--border2);
    border-radius: var(--r-md); color: var(--text); font-size: 16px; font-weight: 400;
    transition: border-color 160ms, box-shadow 160ms;
    letter-spacing: -0.01em;
  }
  .plain-input::placeholder { color: var(--text3); }
  .plain-input:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(48,209,88,0.12);
  }

  /* ── Expense list rows ── */
  .expense-rows { display: flex; flex-direction: column; }
  .expense-row-wrapper {
    position: relative; overflow: hidden; 
    border-bottom: 0.5px solid var(--border);
  }
  .expense-row-wrapper:last-child { border-bottom: none; }
  .expense-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 0; background: var(--bg);
    position: relative; z-index: 1;
    transition: transform 250ms cubic-bezier(0.22,1,0.36,1);
    touch-action: pan-y;
  }
  .expense-row.swiped { transform: translateX(-76px); }
  .expense-row-actions {
    position: absolute; right: 0; top: 0; bottom: 0;
    display: flex; gap: 0; height: 100%; width: 76px;
    z-index: 0;
  }
  .expense-btn-delete {
    flex: 1; display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer; font-size: 11px; font-weight: 700;
    transition: background 160ms; color: #fff;
    background: var(--red); text-transform: uppercase; letter-spacing: 0.05em;
  }
  .expense-btn-delete:active { background: rgba(255,69,58,0.85); }
  .expense-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: var(--green-dim); border: 0.5px solid rgba(48,209,88,0.15);
    display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;
  }
  .expense-note { font-size: 15px; font-weight: 500; color: var(--text); }
  .expense-time { font-size: 12px; color: var(--text3); margin-top: 2px; }
  .expense-amount {
    font-size: 16px; font-weight: 700;
    color: var(--text); letter-spacing: -0.02em; flex-shrink: 0; position: relative; z-index: 1;
  }
  .empty-box {
    padding: 28px 18px; text-align: center;
    background: rgba(255,255,255,0.03); border: 0.5px dashed var(--border2);
    border-radius: var(--r-lg); color: var(--text3); font-size: 14px;
  }

  /* ── FAB ── */
  .fab {
    position: fixed; bottom: calc(var(--safe-bottom) + 96px); left: 50%; transform: translateX(-50%);
    height: 54px; padding: 0 28px;
    background: var(--green); color: #000;
    border-radius: var(--r-pill);
    font-size: 15px; font-weight: 700;
    display: flex; align-items: center; gap: 9px;
    box-shadow: 0 4px 32px rgba(48,209,88,0.35);
    transition: transform var(--transition), box-shadow var(--transition);
    z-index: 50; white-space: nowrap;
  }
  .fab:active { transform: translateX(-50%) scale(0.96); }
  .fab:disabled { opacity: 0.5; }

  /* ── Stats ── */
  .insight-card {
    border-radius: var(--r-2xl); padding: 28px 22px; position: relative; overflow: hidden;
    background: linear-gradient(145deg, #0b1f10 0%, #060e09 100%);
    border: 0.5px solid rgba(48,209,88,0.2);
  }
  .insight-glow {
    position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(48,209,88,0.2), transparent 70%);
  }
  .insight-inner { position: relative; z-index: 1; }
  .insight-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--green); margin-bottom: 8px;
  }
  .insight-title {
    font-size: 24px; font-weight: 800;
    letter-spacing: -0.04em; color: var(--text); line-height: 1.1;
  }
  .insight-sub { font-size: 14px; color: var(--text2); margin-top: 8px; line-height: 1.5; }

  .metric-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .metric-tile {
    background: var(--s1); border: 0.5px solid var(--border2);
    border-radius: var(--r-lg); padding: 18px 16px;
  }
  .metric-lbl {
    font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
    text-transform: uppercase; color: var(--text3); margin-bottom: 6px;
  }
  .metric-val {
    font-size: 22px; font-weight: 800;
    letter-spacing: -0.04em; color: var(--text);
  }
  .metric-sub { font-size: 12px; color: var(--text3); margin-top: 4px; }

  /* Chart */
  .chart-area {
    height: 140px; display: flex; align-items: flex-end; gap: 8px; padding-top: 8px;
  }
  .chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; }
  .chart-bar {
    width: 100%; border-radius: 4px 4px 2px 2px;
    background: linear-gradient(180deg, var(--green) 0%, rgba(48,209,88,0.35) 100%);
    transition: height 400ms cubic-bezier(0.22,1,0.36,1);
  }
  .chart-bar-hot { background: linear-gradient(180deg, var(--orange) 0%, rgba(255,69,58,0.35) 100%); }
  .chart-day-lbl { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; }

  /* Comparison */
  .comp-row { display: grid; grid-template-columns: 80px 1fr auto; gap: 12px; align-items: center; margin-top: 14px; }
  .comp-lbl { font-size: 13px; color: var(--text2); }
  .comp-track { width: 100%; height: 4px; background: rgba(255,255,255,0.07); border-radius: var(--r-pill); overflow: hidden; }
  .comp-fill  { height: 100%; border-radius: inherit; }
  .comp-fill-green  { background: linear-gradient(90deg, var(--green2), var(--green)); }
  .comp-fill-yellow { background: linear-gradient(90deg, #8a7000, var(--yellow)); }
  .comp-val { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; }
  .comp-note { font-size: 13px; color: var(--text3); margin-top: 16px; line-height: 1.5; }

  /* ── Gym ── */
  .gym-hero {
    border-radius: var(--r-2xl); padding: 26px 22px; position: relative; overflow: hidden;
    background: linear-gradient(145deg, #0b1f10 0%, #060e09 100%);
    border: 0.5px solid rgba(48,209,88,0.2);
  }
  .gym-hero-glow {
    position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(48,209,88,0.22), transparent 70%);
  }
  .gym-inner { position: relative; z-index: 1; }
  .gym-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }

  /* Toggle */
  .ios-toggle-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
  .ios-toggle-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text3); }
  .ios-toggle {
    width: 52px; height: 31px; border-radius: var(--r-pill); position: relative;
    background: rgba(255,255,255,0.12); transition: background 220ms;
    cursor: pointer;
  }
  .ios-toggle.on { background: var(--green); }
  .ios-toggle-thumb {
    position: absolute; width: 27px; height: 27px;
    background: #fff; border-radius: 50%;
    top: 2px; left: 2px;
    transition: left 220ms cubic-bezier(0.34,1.4,0.64,1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
  }
  .ios-toggle.on .ios-toggle-thumb { left: 23px; }

  .gym-motive {
    padding: 18px 16px; border-radius: var(--r-lg);
    background: rgba(48,209,88,0.06); border: 0.5px solid rgba(48,209,88,0.12);
    font-size: 14px; color: var(--text2); line-height: 1.6;
  }

  /* Calendar */
  .cal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .cal-day {
    min-height: 82px; border-radius: var(--r-md);
    background: rgba(255,255,255,0.04); border: 0.5px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    cursor: pointer; transition: background var(--transition), border-color var(--transition), transform 120ms ease;
    position: relative; overflow: hidden;
  }
  .cal-day.done {
    background: rgba(48,209,88,0.1); border-color: rgba(48,209,88,0.25);
  }
  .cal-day.today { outline: 1.5px solid rgba(48,209,88,0.5); outline-offset: -1.5px; }
  .cal-day:active { transform: scale(0.95); }
  .cal-day:disabled { cursor: default; opacity: 0.6; }
  .cal-lbl { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
  .cal-num { font-size: 20px; font-weight: 800; color: var(--text); letter-spacing: -0.04em; }
  .cal-check { font-size: 16px; }
  .cal-day.done .cal-lbl { color: rgba(48,209,88,0.7); }

  /* ── Profile ── */
  .profile-score-card {
    border-radius: var(--r-2xl); padding: 32px 24px; text-align: center;
    background: linear-gradient(145deg, #100e1e 0%, #0b091a 100%);
    border: 0.5px solid rgba(191,90,242,0.2);
    position: relative; overflow: hidden;
  }
  .profile-score-glow {
    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 240px; height: 240px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(191,90,242,0.18), transparent 70%);
  }
  .profile-score-inner { position: relative; z-index: 1; }
  .profile-score-lbl {
    font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(191,90,242,0.7); margin-bottom: 10px;
  }
  .profile-score {
    font-size: 72px; font-weight: 800;
    letter-spacing: -0.06em; color: var(--text); line-height: 1;
  }
  .profile-score sub {
    font-size: 28px; font-weight: 600; opacity: 0.4; vertical-align: bottom;
  }
  .profile-trend {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
    height: 28px; padding: 0 12px; border-radius: var(--r-pill);
    background: rgba(191,90,242,0.12); border: 0.5px solid rgba(191,90,242,0.2);
    font-size: 12px; font-weight: 600; color: var(--purple);
  }

  .stat-list { display: flex; flex-direction: column; gap: 0; }
  .stat-row {
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
    padding: 15px 0; border-bottom: 0.5px solid var(--border);
  }
  .stat-row:last-child { border-bottom: none; padding-bottom: 0; }
  .stat-name { font-size: 14px; color: var(--text2); }
  .stat-val  { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
  .stat-badge {
    height: 24px; padding: 0 10px; border-radius: var(--r-pill);
    font-size: 11px; font-weight: 600; display: inline-flex; align-items: center;
  }
  .stat-badge-good   { background: var(--green-dim); color: var(--green); border: 0.5px solid rgba(48,209,88,0.2); }
  .stat-badge-warn   { background: var(--yellow-dim); color: var(--yellow); border: 0.5px solid rgba(255,214,10,0.2); }

  .btn-logout {
    height: 52px; width: 100%; border-radius: var(--r-pill);
    background: rgba(255,69,58,0.08); border: 0.5px solid rgba(255,69,58,0.2);
    color: var(--red); font-size: 15px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform var(--transition), background var(--transition);
  }
  .btn-logout:active { transform: scale(0.97); background: rgba(255,69,58,0.14); }

  /* ── Bottom Nav ── */
  .bottom-nav {
    position: fixed; left: 0; right: 0; bottom: 0;
    background: rgba(10,10,12,0.92); border-top: 0.5px solid var(--border2);
    border-radius: 22px 22px 0 0;
    display: grid; grid-template-columns: repeat(4, 1fr);
    padding: 10px 10px calc(var(--safe-bottom) + 12px);
    z-index: 100;
    backdrop-filter: blur(15px);
  }
  .nav-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
    height: 58px; border-radius: var(--r-md);
    color: var(--text3);
    transition: color var(--transition), background var(--transition), transform 120ms ease;
    font-weight: 500;
  }
  .nav-btn.active { color: var(--green); background: rgba(48,209,88,0.12); }
  .nav-btn:active { transform: scale(0.93); }
  .nav-btn-label { font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
  .nav-icon { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

  /* ── Install chip ── */
  .install-chip {
    position: fixed; top: calc(var(--safe-top) + 12px); right: 16px; z-index: 200;
    height: 38px; padding: 0 16px; border-radius: var(--r-pill);
    background: var(--s1); border: 0.5px solid var(--border3);
    color: var(--text); font-size: 13px; font-weight: 600;
    display: flex; align-items: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }

  /* ── Animations ── */
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }

  .fade-in { animation: fadeIn 400ms ease both; }
  .slide-in { animation: slideUp 380ms cubic-bezier(0.22,1,0.36,1) both; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
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

// ─── Primitive components ─────────────────────────────────────────────────────
function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "nav-icon"}>
      {ICONS[name]}
    </svg>
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

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({
  dashboard,
  amount,
  note,
  setAmount,
  setNote,
  addExpense,
  isSyncing,
  onDeleteExpense,
  onEditExpense,
  authToken,
}) {
  const dailyBudget = Number(dashboard?.dailyBudget || 120);
  const spent = Number(dashboard?.spent || 0);
  const remaining = dailyBudget - spent;
  const expenses = dashboard?.expenses || [];
  const code = dashboard?.currencyCode || "INR";
  const pct = Math.min((spent / Math.max(dailyBudget, 1)) * 100, 100);
  const tone =
    spent < dailyBudget
      ? "success"
      : spent === dailyBudget
        ? "warning"
        : "danger";
  const pillLabel =
    spent < dailyBudget
      ? "On track"
      : spent === dailyBudget
        ? "Limit hit"
        : "Overspent";

  const [swipedId, setSwipedId] = useState(null);
  const swipeStartXRef = useRef(0);

  function handleSwipeStart(e, expenseId) {
    swipeStartXRef.current = e.touches?.[0].clientX || 0;
  }

  function handleSwipeEnd(e, expenseId) {
    const startX = swipeStartXRef.current;
    const endX = e.changedTouches?.[0].clientX || 0;
    const diff = startX - endX;
    if (diff > 50) {
      setSwipedId(expenseId);
    } else if (diff < -50) {
      setSwipedId(null);
    }
  }

  async function deleteExpense(expenseId) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await fetchJson(
        `/api/expenses/${expenseId}`,
        { method: "DELETE" },
        authToken,
      );
      setSwipedId(null);
      await onDeleteExpense();
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  return (
    <div className="tab-panel fade-in">
        {/* Hero */}
        <div className={`hero hero-${tone}`}>
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-inner">
            <div className="hero-row">
              <div>
                <p className="hero-eyebrow">Today's spend</p>
                <p className="hero-amount">{currency(spent, code)}</p>
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
                  {currency(Math.abs(remaining), code)}
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

        {/* Add Expense */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Quick add</p>
              <p className="card-title">Log expense</p>
            </div>
          </div>
          <form className="expense-form" onSubmit={addExpense}>
            <input
              className="plain-input"
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
              type="text"
              placeholder="Coffee, travel, snack…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </form>
        </div>

        {/* Expense list */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Today</p>
              <p className="card-title">
                {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
          {expenses.length ? (
            <div className="expense-rows">
              {expenses.map((exp) => {
                const expId = String(exp.id || exp._id);
                const isSwiped = swipedId === expId;
                return (
                  <div
                    key={expId}
                    className="expense-row-wrapper"
                    onTouchStart={(e) => handleSwipeStart(e, expId)}
                    onTouchEnd={(e) => handleSwipeEnd(e, expId)}
                  >
                    <div className={`expense-row${isSwiped ? " swiped" : ""}`}>
                      <div className="expense-icon">
                        <svg
                          viewBox="0 0 24 24"
                          style={{
                            width: 18,
                            height: 18,
                            fill: "none",
                            stroke: "var(--green)",
                            strokeWidth: "1.8",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                          }}
                        >
                          {ICONS.wallet}
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="expense-note">{exp.note || "Unlabelled"}</p>
                        <p className="expense-time">
                          {new Date(
                            exp.createdAt || `${exp.date}T00:00:00`,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="expense-amount">
                        {currency(exp.amount, code)}
                      </span>
                    </div>
                    <div className="expense-row-actions">
                      <button
                        className="expense-btn-delete"
                        onClick={() => deleteExpense(expId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-box">
              No expenses yet · Keep it intentional 🎯
            </div>
          )}
        </div>

        <button className="fab" onClick={addExpense} disabled={isSyncing}>
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 20,
              height: 20,
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2.2,
              strokeLinecap: "round",
            }}
          >
            {ICONS.plus}
          </svg>
          <span>{isSyncing ? "Saving…" : "Add Expense"}</span>
        </button>
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab({ statsSummary, weeklySeries, monthlySeries }) {
  const code = statsSummary?.currencyCode || "INR";
  const dailyBudget = Number(statsSummary?.dailyBudget || 120);
  const weeklyBudget = Number(statsSummary?.weeklyBudget || dailyBudget * 7);
  const weeklySpent = Number(statsSummary?.weeklySpent || 0);
  const weeklySaved = Number(statsSummary?.weeklySaved || 0);
  const monthlyBudget = Number(statsSummary?.monthlyBudget || 0);
  const monthlySpent = Number(statsSummary?.monthlySpent || 0);
  const monthlySaved = Number(statsSummary?.monthlySaved || 0);

  const startOfWeek = getStartOfWeek();
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
  const highest = Math.max(...weekDays.map((d) => d.total), dailyBudget);

  return (
    <div className="tab-panel fade-in">
      <div className="insight-card">
        <div className="insight-glow" />
        <div className="insight-inner">
          <p className="insight-label">This week</p>
          <p className="insight-title">
            Saved {currency(weeklySaved, code)} this week
          </p>
          <p className="insight-sub">
            {currency(weeklySpent, code)} spent · {currency(weeklyBudget, code)}{" "}
            planned
          </p>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-tile">
          <p className="metric-lbl">Weekly spent</p>
          <p className="metric-val">{currency(weeklySpent, code)}</p>
          <p className="metric-sub">of {currency(weeklyBudget, code)}</p>
        </div>
        <div className="metric-tile">
          <p className="metric-lbl">Monthly saved</p>
          <p className="metric-val">{currency(monthlySaved, code)}</p>
          <p className="metric-sub">
            of {currency(monthlyBudget, code)} budget
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">Weekly graph</p>
            <p className="card-title">Spending rhythm</p>
          </div>
        </div>
        <div className="chart-area">
          {weekDays.map((day) => (
            <div className="chart-col" key={day.key}>
              <div
                className={`chart-bar${day.total > dailyBudget ? " chart-bar-hot" : ""}`}
                style={{
                  height: `${Math.max((day.total / highest) * 100, 6)}%`,
                }}
              />
              <span className="chart-day-lbl">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

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
              style={{
                width: `${Math.min((weeklySpent / Math.max(weeklyBudget, 1)) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="comp-val">{currency(weeklySpent, code)}</span>
        </div>
        <div className="comp-row">
          <span className="comp-lbl">Monthly</span>
          <div className="comp-track">
            <div
              className="comp-fill comp-fill-yellow"
              style={{
                width: `${Math.min((monthlySpent / Math.max(monthlyBudget, 1)) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="comp-val">{currency(monthlySpent, code)}</span>
        </div>
        <p className="comp-note">
          {monthlySeries.length
            ? `${monthlySeries.length} tracked day${monthlySeries.length > 1 ? "s" : ""} this month.`
            : "No monthly data yet."}
        </p>
      </div>
    </div>
  );
}

// ─── Gym Tab ──────────────────────────────────────────────────────────────────
function GymTab({ gymLogMap, toggleGym, gymSummary, isSyncing }) {
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

  let streak = 0;
  const cur = new Date();
  while (gymLogMap[formatDate(cur)]) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  const weeklyConsistency =
    Number(gymSummary?.weeklyConsistency) ||
    Math.round((weekDates.filter((d) => d.done).length / 7) * 100);
  const todayDone = !!gymLogMap[todayKey];

  return (
    <div className="tab-panel fade-in">
      <div className="gym-hero">
        <div className="gym-hero-glow" />
        <div className="gym-inner">
          <div className="gym-row">
            <div>
              <p className="hero-eyebrow">Daily ritual</p>
              <p className="hero-amount" style={{ fontSize: 36 }}>
                6–7 AM Gym
              </p>
            </div>
            <div className="ios-toggle-wrap">
              <div
                className={`ios-toggle${todayDone ? " on" : ""}`}
                onClick={() => !isSyncing && toggleGym(todayKey)}
                role="switch"
                aria-checked={todayDone}
                tabIndex={0}
              >
                <div className="ios-toggle-thumb" />
              </div>
              <span className="ios-toggle-lbl">
                {isSyncing ? "Saving…" : todayDone ? "Done ✓" : "Log it"}
              </span>
            </div>
          </div>
          <div className="hero-metrics" style={{ marginTop: 20 }}>
            <div className="hero-metric">
              <p className="hero-metric-lbl">Streak</p>
              <p className="hero-metric-val">
                {streak} {streak === 1 ? "day" : "days"} 🔥
              </p>
            </div>
            <div className="hero-metric">
              <p className="hero-metric-lbl">Consistency</p>
              <p className="hero-metric-val">{weeklyConsistency}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="gym-motive">
        🎯{" "}
        {streak > 0
          ? `${streak}-day streak. Every early session compounds. Protect the habit.`
          : "Start today. The hardest rep is showing up. Make it count."}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">This week</p>
            <p className="card-title">Consistency view</p>
          </div>
          <span className="pill pill-success">
            {weekDates.filter((d) => d.done).length}/7 days
          </span>
        </div>
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
      </div>
    </div>
  );
}

// ─── Profile Button ───────────────────────────────────────────────────────────
function ProfileButton({ currentUser, authToken, onProfileUpdate }) {
  const [profileImg, setProfileImg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load profile image from localStorage or use default
    const savedImg = window.localStorage.getItem(
      `profile_img_${currentUser?.id}`,
    );
    if (savedImg) {
      setProfileImg(savedImg);
    } else {
      // Use default profile image from public folder
      setProfileImg("/myprofile.png");
    }
  }, [currentUser?.id]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUser?.id);

      const response = await fetch(`${API_BASE_URL}/api/upload/profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      // Store the image data
      if (data.imageUrl) {
        const fullImageUrl = data.imageUrl.startsWith("http")
          ? data.imageUrl
          : `${API_BASE_URL}${data.imageUrl}`;
        setProfileImg(fullImageUrl);
        window.localStorage.setItem(
          `profile_img_${currentUser?.id}`,
          fullImageUrl,
        );
      }
      onProfileUpdate?.();
    } catch (err) {
      console.error("Profile upload error:", err);
      // Fall back to default image on error
      setProfileImg("/myprofile.png");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initials =
    currentUser?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div style={{ position: "relative" }}>
      <button
        className="topbar-profile-btn"
        onClick={() => fileInputRef.current?.click()}
        title="Click to upload profile picture"
        disabled={uploading}
      >
        {profileImg ? (
          <img
            src={profileImg}
            alt="Profile"
            className="topbar-profile-img"
            onError={() => setProfileImg(null)}
          />
        ) : (
          <span className="topbar-profile-initials">{initials}</span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="profile-upload-input"
        onChange={handleFileUpload}
        disabled={uploading}
      />
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ statsSummary, gymLogMap, gymSummary, onLogout }) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthPrefix = formatDate(today).slice(0, 7);
  const code = statsSummary?.currencyCode || "INR";
  const monthlyBudget = Number(statsSummary?.monthlyBudget || 0);
  const monthlySpent = Number(statsSummary?.monthlySpent || 0);
  const monthlySaved = Number(statsSummary?.monthlySaved || 0);
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

  return (
    <div className="tab-panel fade-in">
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

      <button className="btn-logout" onClick={onLogout}>
        <svg
          viewBox="0 0 24 24"
          style={{
            width: 18,
            height: 18,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.8,
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        >
          {ICONS.logout}
        </svg>
        Sign out
      </button>
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

  const loadAppData = useCallback(async () => {
    setIsSyncing(true);
    setErrorMessage("");
    try {
      const [dash, stats, weekly, monthly, gyms, gymSum] = await Promise.all([
        fetchJson("/api/dashboard/today", {}, authToken),
        fetchJson("/api/stats/summary", {}, authToken),
        fetchJson("/api/stats/weekly", {}, authToken),
        fetchJson("/api/stats/monthly", {}, authToken),
        fetchJson("/api/gym", {}, authToken),
        fetchJson("/api/gym/summary", {}, authToken),
      ]);
      setDashboard(dash);
      setStatsSummary(stats);
      setWeeklySeries(weekly);
      setMonthlySeries(monthly);
      setGymLogs(gyms);
      setGymSummary(gymSum);
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
            category: "general",
            date: getTodayKey(),
          }),
        },
        authToken,
      );
      setAmount("");
      setNote("");
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

  async function toggleGym(dateKey) {
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
      <main className="shell">
        {/* Topbar */}
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
              authToken={authToken}
              onProfileUpdate={() => {}}
            />
          </div>
        </header>

        {/* Content */}
        <section className="content">
          {errorMessage && (
            <div className="error-banner" role="alert">
              {errorMessage}
            </div>
          )}

          {activeTab === "home" && (
            <HomeTab
              dashboard={dashboard}
              amount={amount}
              note={note}
              setAmount={setAmount}
              setNote={setNote}
              addExpense={addExpense}
              isSyncing={isSyncing}
              onDeleteExpense={loadAppData}
              onEditExpense={loadAppData}
              authToken={authToken}
            />
          )}
          {activeTab === "stats" && (
            <StatsTab
              statsSummary={statsSummary}
              weeklySeries={weeklySeries}
              monthlySeries={monthlySeries}
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
            />
          )}
        </section>

        {/* Bottom Nav */}
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
    </>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── API & Constants ─────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://expensetracker-zwgt.onrender.com";
const TOKEN_KEY = "discipline_tracker_token";

// ─── Utility functions ───────────────────────────────────────────────────────
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayKey() {
  return formatDate(new Date());
}

function currency(value, code = "INR") {
  if (code === "INR")
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  return `${code} ${value}`;
}

async function fetchJson(path, options = {}, authToken) {
  const headers = new Headers(options.headers || {});
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.message || response.statusText);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// ─── Swipe constants ──────────────────────────────────────────────────────────
const ACTION_WIDTH = 160; // total reveal width (2 × 80px buttons)
const SWIPE_THRESHOLD = 60;

// ─── Inline styles injected once ─────────────────────────────────────────────
const HOME_STYLES = `
  /* ── Expense list container ── */
  .exp-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    border-radius: 20px;
    border: 0.5px solid rgba(255,255,255,0.09);
    background: rgba(18,18,22,0.98);
  }

  /* ── Single swipeable row ── */
  .exp-item {
    position: relative;
    overflow: hidden;
    border-bottom: 0.5px solid rgba(255,255,255,0.07);
  }
  .exp-item:last-child { border-bottom: none; }

  /* Hidden action panel (sits behind the row) */
  .exp-actions {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    display: flex;
    width: ${ACTION_WIDTH}px;
    z-index: 1;
    border-radius: 0 20px 20px 0;
    overflow: hidden;
  }
  .exp-action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: none;
    cursor: pointer;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    transition: filter 100ms;
    -webkit-tap-highlight-color: transparent;
  }
  .exp-action-btn:active { filter: brightness(0.82); }
  .exp-action-btn svg {
    width: 20px; height: 20px;
    fill: none; stroke: currentColor;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }

  .exp-action-edit {
    background: linear-gradient(160deg, #0a7ef5 0%, #0055cc 100%);
    color: #fff;
  }
  .exp-action-delete {
    background: linear-gradient(160deg, #ff4040 0%, #cc1f1f 100%);
    color: #fff;
    border-radius: 0 0 0 0;
  }

  /* The sliding row face */
  .exp-face {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 15px 18px;
    background: rgba(18,18,22,0.98);
    will-change: transform;
    transition: transform 0ms linear; /* overridden by JS during drag */
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-y;
  }
  .exp-face.snapping {
    transition: transform 320ms cubic-bezier(0.22,1,0.36,1) !important;
  }

  /* Icon dot */
  .exp-cat-dot {
    width: 42px; height: 42px;
    border-radius: 13px;
    background: rgba(48,209,88,0.1);
    border: 0.5px solid rgba(48,209,88,0.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .exp-cat-dot svg {
    width: 18px; height: 18px;
    fill: none; stroke: var(--green, #30d158);
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }

  .exp-body { flex: 1; min-width: 0; }
  .exp-label {
    font-size: 15px; font-weight: 600;
    color: #f5f5f7; letter-spacing: -0.015em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .exp-meta {
    margin-top: 2px;
    display: flex; align-items: center; gap: 6px;
  }
  .exp-time {
    font-size: 12px; color: rgba(245,245,247,0.38); font-weight: 400;
  }
  .exp-tag {
    height: 16px; padding: 0 6px;
    background: rgba(48,209,88,0.12);
    border: 0.5px solid rgba(48,209,88,0.2);
    border-radius: 99px;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--green, #30d158);
    display: flex; align-items: center;
  }

  .exp-amount {
    font-size: 16px; font-weight: 700;
    color: #f5f5f7; letter-spacing: -0.025em;
    flex-shrink: 0;
  }

  /* Swipe hint arrow that appears on first render */
  .exp-hint {
    font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
    color: rgba(245,245,247,0.22); text-transform: uppercase;
    text-align: right; padding: 0 18px 12px;
    display: flex; align-items: center; justify-content: flex-end; gap: 5px;
    animation: hintFade 3s ease 1.2s both;
  }
  @keyframes hintFade {
    0%   { opacity: 0; transform: translateX(6px); }
    20%  { opacity: 1; transform: translateX(0); }
    80%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .exp-hint-arrow {
    display: inline-flex; gap: 2px;
  }
  .exp-hint-arrow span {
    display: inline-block;
    width: 5px; height: 5px;
    border-top: 1.5px solid rgba(245,245,247,0.28);
    border-right: 1.5px solid rgba(245,245,247,0.28);
    transform: rotate(45deg);
    border-radius: 1px;
  }
  .exp-hint-arrow span:nth-child(2) { opacity: 0.55; }
  .exp-hint-arrow span:nth-child(3) { opacity: 0.22; }

  /* ── Edit bottom sheet ── */
  .edit-sheet-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: sheetOverlayIn 220ms ease both;
  }
  @keyframes sheetOverlayIn { from { opacity: 0; } to { opacity: 1; } }

  .edit-sheet {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: #111115;
    border: 0.5px solid rgba(255,255,255,0.14);
    border-bottom: none;
    border-radius: 26px 26px 0 0;
    padding: 0 0 env(safe-area-inset-bottom, 24px);
    animation: sheetSlideUp 340ms cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes sheetSlideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .edit-sheet-handle-row {
    display: flex; justify-content: center;
    padding: 12px 0 4px;
  }
  .edit-sheet-handle {
    width: 36px; height: 4px;
    border-radius: 99px;
    background: rgba(255,255,255,0.18);
  }

  .edit-sheet-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 22px 14px;
  }
  .edit-sheet-title {
    font-size: 17px; font-weight: 700;
    color: #f5f5f7; letter-spacing: -0.02em;
  }
  .edit-sheet-close {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: rgba(245,245,247,0.6);
    font-size: 14px;
    transition: background 150ms;
  }
  .edit-sheet-close:active { background: rgba(255,255,255,0.18); }

  .edit-sheet-fields {
    padding: 0 20px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .edit-field-group { display: flex; flex-direction: column; gap: 6px; }
  .edit-field-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    color: rgba(245,245,247,0.35);
    padding-left: 4px;
  }
  .edit-field-input {
    width: 100%;
    height: 52px;
    padding: 0 16px;
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.14);
    border-radius: 14px;
    color: #f5f5f7;
    font-size: 16px; font-weight: 500;
    font-family: inherit;
    outline: none;
    letter-spacing: -0.01em;
    transition: border-color 160ms, box-shadow 160ms, background 160ms;
    -webkit-appearance: none;
  }
  .edit-field-input::placeholder { color: rgba(245,245,247,0.25); }
  .edit-field-input:focus {
    border-color: var(--green, #30d158);
    box-shadow: 0 0 0 3px rgba(48,209,88,0.14);
    background: rgba(255,255,255,0.08);
  }

  .edit-sheet-actions {
    display: flex; gap: 10px;
    padding: 20px 20px 8px;
  }
  .edit-action-cancel {
    flex: 1; height: 52px;
    border-radius: 99px;
    background: rgba(255,255,255,0.08);
    border: 0.5px solid rgba(255,255,255,0.14);
    color: rgba(245,245,247,0.7);
    font-size: 15px; font-weight: 600;
    cursor: pointer;
    transition: background 150ms, transform 120ms;
  }
  .edit-action-cancel:active { transform: scale(0.97); background: rgba(255,255,255,0.12); }

  .edit-action-save {
    flex: 1.6; height: 52px;
    border-radius: 99px;
    background: var(--green, #30d158);
    color: #000;
    font-size: 15px; font-weight: 700;
    border: none; cursor: pointer;
    box-shadow: 0 4px 24px rgba(48,209,88,0.28);
    transition: transform 120ms, opacity 140ms;
  }
  .edit-action-save:active { transform: scale(0.97); opacity: 0.88; }
  .edit-action-save:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Delete confirm sheet ── */
  .del-sheet {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: #111115;
    border: 0.5px solid rgba(255,69,58,0.22);
    border-bottom: none;
    border-radius: 26px 26px 0 0;
    padding: 0 0 env(safe-area-inset-bottom, 24px);
    animation: sheetSlideUp 300ms cubic-bezier(0.22,1,0.36,1) both;
  }
  .del-sheet-body {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 24px 24px 8px; text-align: center;
  }
  .del-icon-wrap {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(255,69,58,0.12);
    border: 0.5px solid rgba(255,69,58,0.28);
    display: flex; align-items: center; justify-content: center;
  }
  .del-icon-wrap svg {
    width: 24px; height: 24px; fill: none;
    stroke: #ff453a; stroke-width: 1.8;
    stroke-linecap: round; stroke-linejoin: round;
  }
  .del-title {
    font-size: 18px; font-weight: 700;
    color: #f5f5f7; letter-spacing: -0.02em;
  }
  .del-desc {
    font-size: 14px; color: rgba(245,245,247,0.5);
    line-height: 1.55; max-width: 280px;
  }
  .del-desc strong { color: rgba(245,245,247,0.85); font-weight: 600; }
  .del-actions {
    display: flex; flex-direction: column; gap: 10px;
    padding: 16px 20px 8px;
  }
  .del-confirm-btn {
    width: 100%; height: 52px; border-radius: 99px;
    background: rgba(255,69,58,0.15);
    border: 0.5px solid rgba(255,69,58,0.3);
    color: #ff453a; font-size: 15px; font-weight: 700;
    cursor: pointer;
    transition: background 140ms, transform 120ms;
  }
  .del-confirm-btn:active { transform: scale(0.97); background: rgba(255,69,58,0.24); }
  .del-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .del-cancel-btn {
    width: 100%; height: 52px; border-radius: 99px;
    background: rgba(255,255,255,0.08);
    border: 0.5px solid rgba(255,255,255,0.12);
    color: rgba(245,245,247,0.65); font-size: 15px; font-weight: 600;
    cursor: pointer;
    transition: background 140ms, transform 120ms;
  }
  .del-cancel-btn:active { transform: scale(0.97); background: rgba(255,255,255,0.12); }

  /* ── Hero card tweaks ── */
  .hero { border-radius: 26px; }

  /* ── List section header ── */
  .exp-section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2px 10px;
  }
  .exp-section-label {
    font-size: 18px; font-weight: 700;
    letter-spacing: -0.025em; color: #f5f5f7;
  }
  .exp-section-count {
    height: 24px; padding: 0 10px;
    border-radius: 99px;
    background: rgba(48,209,88,0.12);
    border: 0.5px solid rgba(48,209,88,0.22);
    font-size: 12px; font-weight: 700;
    color: var(--green, #30d158);
    display: flex; align-items: center;
  }

  /* ── Empty state ── */
  .exp-empty {
    display: flex; flex-direction: column; align-items: center;
    gap: 10px; padding: 40px 20px;
    text-align: center;
  }
  .exp-empty-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 0.5px dashed rgba(255,255,255,0.14);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .exp-empty-text { font-size: 14px; color: rgba(245,245,247,0.32); font-weight: 500; }
  .exp-empty-sub { font-size: 12px; color: rgba(245,245,247,0.2); }

  /* ── FAB override ── */
  .exp-fab {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
    left: 50%; transform: translateX(-50%);
    height: 52px; padding: 0 28px;
    background: var(--green, #30d158); color: #000;
    border: none; border-radius: 99px;
    font-size: 15px; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 32px rgba(48,209,88,0.38);
    transition: transform 200ms cubic-bezier(0.34,1.4,0.64,1), box-shadow 200ms;
    z-index: 50; white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .exp-fab:active { transform: translateX(-50%) scale(0.95); box-shadow: 0 2px 16px rgba(48,209,88,0.25); }
  .exp-fab:disabled { opacity: 0.5; }
  .exp-fab svg { width: 18px; height: 18px; fill: none; stroke: #000; stroke-width: 2.4; stroke-linecap: round; }

  /* ── Add-form card ── */
  .add-card {
    background: rgba(18,18,22,0.98);
    border: 0.5px solid rgba(255,255,255,0.09);
    border-radius: 22px;
    padding: 18px 18px 16px;
  }
  .add-card-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(245,245,247,0.3); margin-bottom: 14px;
  }
  .add-form { display: flex; flex-direction: column; gap: 10px; }
  .add-input-row { display: flex; gap: 10px; }
  .add-amt-wrap {
    position: relative;
    flex: 0 0 120px;
  }
  .add-amt-prefix {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 16px; font-weight: 600; color: rgba(245,245,247,0.35);
    pointer-events: none;
  }
  .add-input {
    height: 52px; width: 100%;
    padding: 0 14px;
    background: rgba(255,255,255,0.05);
    border: 0.5px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    color: #f5f5f7; font-size: 16px; font-weight: 500;
    font-family: inherit; outline: none;
    -webkit-appearance: none;
    transition: border-color 160ms, box-shadow 160ms, background 160ms;
    letter-spacing: -0.01em;
  }
  .add-input.amt { padding-left: 30px; }
  .add-input::placeholder { color: rgba(245,245,247,0.22); }
  .add-input:focus {
    border-color: var(--green, #30d158);
    box-shadow: 0 0 0 3px rgba(48,209,88,0.12);
    background: rgba(255,255,255,0.07);
  }
  .add-submit-btn {
    width: 100%; height: 52px; border-radius: 99px;
    background: var(--green, #30d158); color: #000;
    font-size: 15px; font-weight: 700; border: none; cursor: pointer;
    box-shadow: 0 0 20px rgba(48,209,88,0.22);
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: transform 150ms, opacity 140ms;
    -webkit-tap-highlight-color: transparent;
  }
  .add-submit-btn:active { transform: scale(0.97); opacity: 0.88; }
  .add-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .add-submit-btn svg { width: 16px; height: 16px; fill: none; stroke: #000; stroke-width: 2.4; stroke-linecap: round; }
`;

// ─── Swipeable Row ────────────────────────────────────────────────────────────
function SwipeableExpenseRow({
  exp,
  code,
  onEditTap,
  onDeleteTap,
  isFirst,
  isLast,
}) {
  const faceRef = useRef(null);
  const startXRef = useRef(null);
  const currentXRef = useRef(0);
  const isOpenRef = useRef(false);
  const [open, setOpen] = useState(false);

  function snap(toOpen) {
    const face = faceRef.current;
    if (!face) return;
    face.classList.add("snapping");
    const target = toOpen ? -ACTION_WIDTH : 0;
    face.style.transform = `translateX(${target}px)`;
    currentXRef.current = target;
    isOpenRef.current = toOpen;
    setOpen(toOpen);
    setTimeout(() => face.classList.remove("snapping"), 340);
  }

  function onTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
  }
  function onTouchMove(e) {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const base = isOpenRef.current ? -ACTION_WIDTH : 0;
    const raw = base + dx;
    const clamped = Math.max(-ACTION_WIDTH, Math.min(0, raw));
    if (faceRef.current) {
      faceRef.current.style.transition = "none";
      faceRef.current.style.transform = `translateX(${clamped}px)`;
    }
    currentXRef.current = clamped;
  }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - startXRef.current;
    startXRef.current = null;
    if (isOpenRef.current) {
      snap(dx < SWIPE_THRESHOLD); // close if swiped right enough
    } else {
      snap(dx < -SWIPE_THRESHOLD); // open if swiped left enough
    }
  }

  // Close if another row opens
  useEffect(() => {
    if (!open) snap(false);
  }, []);

  const expTime = new Date(
    exp.createdAt || `${exp.date}T00:00:00`,
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="exp-item">
      {/* Action buttons behind */}
      <div className="exp-actions">
        <button
          className="exp-action-btn exp-action-edit"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            snap(false);
            onEditTap(exp);
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        <button
          className="exp-action-btn exp-action-delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            snap(false);
            onDeleteTap(exp);
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
          </svg>
          Delete
        </button>
      </div>

      {/* Sliding face */}
      <div
        ref={faceRef}
        className="exp-face"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (open) snap(false);
        }}
      >
        <div className="exp-cat-dot">
          <svg viewBox="0 0 24 24">
            <path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M16 12h4M18 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
          </svg>
        </div>
        <div className="exp-body">
          <p className="exp-label">{exp.note || "Unlabelled"}</p>
          <div className="exp-meta">
            <span className="exp-time">{expTime}</span>
            {exp.category && exp.category !== "general" && (
              <span className="exp-tag">{exp.category}</span>
            )}
          </div>
        </div>
        <span className="exp-amount">{currency(exp.amount, code)}</span>
      </div>
    </div>
  );
}

// ─── Edit Bottom Sheet ────────────────────────────────────────────────────────
function EditSheet({ expense, onClose, onSaved, onError, authToken }) {
  const [amt, setAmt] = useState(String(expense.amount));
  const [note, setNote] = useState(expense.note || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = Number(amt);
    if (!num) return;
    setSaving(true);
    try {
      await fetchJson(
        `/api/expenses/${expense.id || expense._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: num,
            note: note.trim(),
            category: expense.category || "general",
          }),
        },
        authToken,
      );
      onSaved();
    } catch (e) {
      onError?.(e.message || "Failed to update expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-sheet-overlay" onClick={onClose}>
      <div className="edit-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="edit-sheet-handle-row">
          <div className="edit-sheet-handle" />
        </div>
        <div className="edit-sheet-header">
          <p className="edit-sheet-title">Edit Expense</p>
          <button className="edit-sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="edit-sheet-fields">
          <div className="edit-field-group">
            <p className="edit-field-label">Amount</p>
            <input
              className="edit-field-input"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="0"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              autoFocus
            />
          </div>
          <div className="edit-field-group">
            <p className="edit-field-label">Description</p>
            <input
              className="edit-field-input"
              type="text"
              placeholder="Coffee, lunch, transport…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="edit-sheet-actions">
          <button className="edit-action-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="edit-action-save" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Sheet ─────────────────────────────────────────────────────
function DeleteSheet({
  expense,
  code,
  onClose,
  onDeleted,
  onError,
  authToken,
}) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await fetchJson(
        `/api/expenses/${expense.id || expense._id}`,
        { method: "DELETE" },
        authToken,
      );
      onDeleted();
    } catch (e) {
      onError?.(
        e.status === 404
          ? "Delete is not available on the deployed backend yet. Redeploy the backend with the latest expense routes."
          : e.message || "Failed to delete expense.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="edit-sheet-overlay" onClick={onClose}>
      <div className="del-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="edit-sheet-handle-row">
          <div className="edit-sheet-handle" />
        </div>
        <div className="del-sheet-body">
          <div className="del-icon-wrap">
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
            </svg>
          </div>
          <p className="del-title">Delete expense?</p>
          <p className="del-desc">
            <strong>{expense.note || "Unlabelled"}</strong> ·{" "}
            {currency(expense.amount, code)}
            <br />
            This can't be undone.
          </p>
        </div>
        <div className="del-actions">
          <button
            className="del-confirm-btn"
            onClick={confirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Yes, delete it"}
          </button>
          <button className="del-cancel-btn" onClick={onClose}>
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main HomePage ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [authToken] = useState(() =>
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(TOKEN_KEY) || ""
      : "",
  );

  const loadData = useCallback(async () => {
    if (!authToken) return;
    setIsSyncing(true);
    try {
      const data = await fetchJson("/api/dashboard/today", {}, authToken);
      setDashboard(data);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message || "Failed to load data");
    } finally {
      setIsSyncing(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, [loadData]);

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
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to save expense.");
      setIsSyncing(false);
    }
  }

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

  return (
    <>
      <style>{HOME_STYLES}</style>

      {/* Modals */}
      {editTarget && (
        <EditSheet
          expense={editTarget}
          authToken={authToken}
          onClose={() => setEditTarget(null)}
          onError={(message) => setErrorMessage(message)}
          onSaved={() => {
            setEditTarget(null);
            loadData();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteSheet
          expense={deleteTarget}
          code={code}
          authToken={authToken}
          onClose={() => setDeleteTarget(null)}
          onError={(message) => setErrorMessage(message)}
          onDeleted={() => {
            setDeleteTarget(null);
            loadData();
          }}
        />
      )}

      {errorMessage && (
        <div className="error-banner" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="tab-panel fade-in">
        {/* ── Hero spend card ── */}
        <div className={`hero hero-${tone}`}>
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-inner">
            <div className="hero-row">
              <div>
                <p className="hero-eyebrow">Today&apos;s spend</p>
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

        {/* ── Add expense form ── */}
        <div className="add-card">
          <p className="add-card-eyebrow">Quick add</p>
          <form className="add-form" onSubmit={addExpense}>
            <div className="add-input-row">
              <div className="add-amt-wrap">
                <span className="add-amt-prefix">₹</span>
                <input
                  className="add-input amt"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <input
                className="add-input"
                style={{ flex: 1 }}
                type="text"
                placeholder="What was it for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button
              className="add-submit-btn"
              type="submit"
              disabled={isSyncing || !amount}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {isSyncing ? "Saving…" : "Add expense"}
            </button>
          </form>
        </div>

        {/* ── Expense list ── */}
        <div>
          <div className="exp-section-header">
            <p className="exp-section-label">Today's log</p>
            {expenses.length > 0 && (
              <span className="exp-section-count">
                {expenses.length} {expenses.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {expenses.length > 0 && (
            <div className="exp-hint">
              <span>Swipe left to edit or delete</span>
              <span className="exp-hint-arrow">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {expenses.length ? (
            <div className="exp-list">
              {expenses.map((exp, i) => (
                <SwipeableExpenseRow
                  key={String(exp.id || exp._id)}
                  exp={exp}
                  code={code}
                  isFirst={i === 0}
                  isLast={i === expenses.length - 1}
                  onEditTap={setEditTarget}
                  onDeleteTap={setDeleteTarget}
                />
              ))}
            </div>
          ) : (
            <div className="exp-list">
              <div className="exp-empty">
                <div className="exp-empty-icon">🎯</div>
                <p className="exp-empty-text">No expenses yet</p>
                <p className="exp-empty-sub">Keep it intentional today</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="exp-fab" onClick={addExpense} disabled={isSyncing}>
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {isSyncing ? "Saving…" : "Add Expense"}
      </button>
    </>
  );
}

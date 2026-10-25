import { useEffect, useRef, useState } from "react";
import "./DateField.css";

// start.ng's own date (and date-and-time) picker, in the site's colours. Used instead of the browser's
// <input type="date"> and <input type="datetime-local">: those look different in every browser, and on some Windows
// machines the date-and-time one crashes Chrome ("Aw, Snap!", STATUS_ACCESS_VIOLATION).
//
//   <DateField value="2026-10-25" onChange={setDay} />                         a day, "YYYY-MM-DD" ("" = none)
//   <DateField time value="2026-10-25T18:00" onChange={setStart} />            a day and a time, "YYYY-MM-DDTHH:mm"

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MINUTES = ["00", "15", "30", "45"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  time?: boolean; // also pick a time (value "YYYY-MM-DDTHH:mm")
  min?: string; // the first day that can be picked, "YYYY-MM-DD"
  max?: string;
  placeholder?: string;
  label?: string; // for screen readers when there's no visible label
  required?: boolean;
};

export default function DateField({ value, onChange, time = false, min, max, placeholder = "Pick a date", label, required }: Props) {
  const [day, clock = "18:00"] = value ? value.split("T") : ["", undefined];
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDay(day || dayKey(new Date())));
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  useEffect(() => { if (open && day) setMonth(parseDay(day)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (d: string, c = clock) => onChange(d ? (time ? `${d}T${c}` : d) : "");
  const pickDay = (d: string) => { emit(d); if (!time) setOpen(false); };
  const [hour, minute] = clock.split(":");

  // the month's grid, Monday first, with the days around it greyed out
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const today = dayKey(new Date());
  const shown = day
    ? parseDay(day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + (time ? ` · ${clock}` : "")
    : "";
  const allowed = (k: string) => (!min || k >= min) && (!max || k <= max);
  const moveMonth = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <div className="datefield" ref={box}>
      <button type="button" className={`datefield-button ${day ? "" : "empty"}`} aria-haspopup="dialog" aria-expanded={open}
        aria-label={label ? `${label}: ${shown || "not set"}` : undefined} onClick={() => setOpen((o) => !o)}>
        <span>{shown || placeholder}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
      {required && <input className="datefield-required" tabIndex={-1} required value={value} onChange={() => {}} aria-hidden="true" />}
      {open && (
        <div className="datefield-pop" role="dialog" aria-label={label ?? "Pick a date"}>
          <div className="datefield-head">
            <button type="button" className="datefield-nav" onClick={() => moveMonth(-1)} aria-label="Previous month">‹</button>
            <b>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</b>
            <button type="button" className="datefield-nav" onClick={() => moveMonth(1)} aria-label="Next month">›</button>
          </div>
          <div className="datefield-grid" role="grid">
            {WEEKDAYS.map((w) => <span key={w} className="datefield-weekday">{w}</span>)}
            {cells.map((c) => {
              const k = dayKey(c);
              return (
                <button key={k} type="button" disabled={!allowed(k)} onClick={() => pickDay(k)}
                  className={`datefield-day${c.getMonth() !== month.getMonth() ? " out" : ""}${k === today ? " today" : ""}${k === day ? " on" : ""}`}
                  aria-pressed={k === day} aria-label={c.toLocaleDateString(undefined, { dateStyle: "full" })}>
                  {c.getDate()}
                </button>
              );
            })}
          </div>
          {time && (
            <div className="datefield-time">
              <span>Time</span>
              <select value={hour} onChange={(e) => day && emit(day, `${e.target.value}:${minute}`)} aria-label="Hour" disabled={!day}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={pad(h)}>{pad(h)}</option>)}
              </select>
              <b>:</b>
              <select value={MINUTES.includes(minute) ? minute : "00"} onChange={(e) => day && emit(day, `${hour}:${e.target.value}`)} aria-label="Minute" disabled={!day}>
                {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="datefield-foot">
            {!required && <button type="button" className="link" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>}
            <button type="button" className="link" disabled={!allowed(today)} onClick={() => { setMonth(new Date()); pickDay(today); }}>Today</button>
            {time && <button type="button" className="datefield-done" onClick={() => setOpen(false)}>Done</button>}
          </div>
        </div>
      )}
    </div>
  );
}

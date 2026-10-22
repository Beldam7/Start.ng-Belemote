import type { Track, Zone } from "./api";

export const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const TRACK_INFO: Record<Track, string> = {
  sprint: "2-hour rounds",
  daily: "Resets every day",
  weekly: "Resets every week",
};

export const RESULT: Record<Zone, string> = { up: "Promoted", down: "Relegated", stay: "Stayed", out: "Didn't play" };

/** "1d 04:12:09" or "04:12:09" until the round ends. */
export function countdown(endsAt: string, now: number): string {
  const s = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000));
  const d = Math.floor(s / 86400);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}

/** "Mon 19 Oct" or "Mon 19 Oct, 14:00" (Sprint rounds are 2 hours, so they need the time). */
export const roundDate = (iso: string, withTime: boolean) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) });

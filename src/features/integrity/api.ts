// Score integrity's API calls (startng-be app/features/integrity).
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type FlagStatus = "open" | "cleared" | "confirmed";
/** A run held back because it looks too good to be true. stats: what the game sent, by stat key. */
export type Flag = {
  id: number; game: string; player_id: number; player: string; reason: string; status: FlagStatus;
  stats: Record<string, number>; previous_best: number | null; created_at: string; reviewed_at: string | null;
  reviewed_by: string | null; note: string | null; // the last two: admins only
};

const token = () => localStorage.getItem("token");

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Something went wrong. Try again.");
  return data;
}

const decide = (id: number, outcome: "clear" | "confirm", note: string) =>
  call<Flag>(`/admin/score-flags/${id}/${outcome}`, { method: "POST", body: JSON.stringify({ note: note || null }) });

export const flagsApi = {
  list: (status: FlagStatus) => call<Flag[]>(`/admin/score-flags?status=${status}&limit=200`),
  clear: (id: number, note: string) => decide(id, "clear", note),
  confirm: (id: number, note: string) => decide(id, "confirm", note),
};

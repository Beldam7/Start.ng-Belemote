// The game owner's view of score integrity (startng-be app/features/integrity): runs held back in their own game.
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type OwnerFlag = {
  id: number; game: string; player_id: number; player: string; reason: string; status: "open" | "cleared" | "confirmed";
  stats: Record<string, number>; previous_best: number | null; created_at: string; reviewed_at: string | null;
};

/** The runs held back in this game (the owner only; never an email or an admin's note). */
export async function gameFlags(game: string): Promise<OwnerFlag[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(game)}/flags`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error("Could not load this game's held scores");
  return res.json();
}

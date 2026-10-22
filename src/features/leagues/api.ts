// Leagues' API calls (startng-be app/features/leagues). Signed in only; every route is a 404 while the flag is off.
// There is no join call: a player's first run in a round seats them in a group.
import type { Character } from "../../character";
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export const TRACKS = ["sprint", "daily", "weekly"] as const;
export type Track = (typeof TRACKS)[number];
export type Zone = "up" | "down" | "stay" | "out";

export type Player = { id: number; name: string | null; character: Character | null };
export type Row = { place: number | null; player: Player; points: number; games: number; zone: Zone; me: boolean };
export type Table = {
  track: Track; starts_at: string; ends_at: string; tier: string;
  group: number | null; // null: not played this round yet
  waiting: boolean; // under 10 players: nobody moves
  points_to_promotion: number | null; // null: already in the zone, top tier, or waiting
  me: Row | null; rows: Row[];
};
export type TrackSummary = { track: Track; starts_at: string; ends_at: string; tier: string; group: number | null; me: Row | null; top: Row[] };
export type HistoryRound = { starts_at: string; ends_at: string; tier: string; place: number | null; points: number; result: Zone };

const token = () => localStorage.getItem("token");
const headers = (): HeadersInit => (token() ? { Authorization: `Bearer ${token()}` } : {});

async function call<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/leagues${path}`, { headers: headers() });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "Something went wrong. Try again.");
  if (data === null) throw new Error("Something went wrong. Try again."); // an OK answer that isn't JSON
  return data;
}

export const getLeagues = () => call<{ tracks: TrackSummary[] }>("").then((d) => d.tracks);
export const getTable = (track: Track) => call<Table>(`/${track}`);
export const getHistory = (track: Track) => call<{ track: Track; rounds: HistoryRound[] }>(`/${track}/history`).then((d) => d.rounds);

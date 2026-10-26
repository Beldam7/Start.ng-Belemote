import { call, send } from "../../api";

export type FixRequest = {
  id: number; game: string; game_url: string; cover_url: string | null; owner: string | null;
  status: "waiting_owner" | "owner_fixed"; note: string; owner_note: string | null; rounds: number;
  created_by: string | null; automatic: boolean; created_at: string; owner_fixed_at: string | null;
};

const t = () => localStorage.getItem("token");
export const queue = () => call<FixRequest[]>(t(), "/admin/needs-fixing");
export const mark = (game: string, note: string) => call<FixRequest>(t(), `/admin/needs-fixing/games/${encodeURIComponent(game)}`, send("POST", { note }));
export const approve = (id: number) => call<FixRequest>(t(), `/admin/needs-fixing/${id}/approve`, send("POST"));
export const sendBack = (id: number, note: string) => call<FixRequest>(t(), `/admin/needs-fixing/${id}/reopen`, send("POST", { note }));
export const ownerFixed = (id: number, note: string) => call<FixRequest>(t(), `/needs-fixing/${id}/fixed`, send("POST", { note: note || null }));

// The owner's open requests, fetched once for all their game cards (and again after a change).
let mineCache: Promise<FixRequest[]> | null = null;
export function mine(fresh = false): Promise<FixRequest[]> {
  if (fresh || !mineCache) mineCache = call<FixRequest[]>(t(), "/needs-fixing/mine").catch(() => []);
  return mineCache;
}

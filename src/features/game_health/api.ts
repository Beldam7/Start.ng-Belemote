import { call, send } from "../../api";

export type Health = {
  game: string; url: string; owner: string | null; status: "ok" | "failing" | "unhealthy" | "unchecked"; failures: number;
  problems: { code: string; message: string }[]; checked_at: string | null; last_ok_at: string | null; unhealthy_since: string | null; hidden?: string | null;
};
export type Overview = { counts: Record<string, number>; games: Health[] };

const t = () => localStorage.getItem("token");
export const overview = () => call<Overview>(t(), "/admin/game-health");
export const checkNow = (game: string) => call<Health>(t(), `/admin/game-health/games/${encodeURIComponent(game)}/check`, send("POST"));
export const checkAll = () => call<{ queued: number }>(t(), "/admin/game-health/scan", send("POST"));
export const ownerCheck = (game: string) => call<Health>(t(), `/game-health/games/${encodeURIComponent(game)}/check`, send("POST"));

// The owner's unhealthy games, fetched once for all their game cards (and again after a check).
let mineCache: Promise<Health[]> | null = null;
export function mine(fresh = false): Promise<Health[]> {
  if (fresh || !mineCache) mineCache = call<Health[]>(t(), "/game-health/mine").catch(() => []);
  return mineCache;
}

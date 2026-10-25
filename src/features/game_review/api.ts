import { call, send } from "../../api";

export type Review = {
  game: string; url: string; repo_url: string; cover_url: string | null; description: string | null; owner: string | null;
  status: "pending" | "approved" | "rejected"; reason: string | null; reason_label: string | null; note: string | null;
  rounds: number; submitted_at: string; decided_at: string | null; decided_by: string | null;
  meets_standards: boolean | null; health: string | null;
};
export type Queue = { reasons: Record<string, string>; pending: Review[]; rejected: Review[] };

const t = () => localStorage.getItem("token");
export const queue = () => call<Queue>(t(), "/admin/game-review");
export const approve = (game: string) => call<Review>(t(), `/admin/game-review/${encodeURIComponent(game)}/approve`, send("POST"));
export const reject = (game: string, reason: string, note: string) =>
  call<Review>(t(), `/admin/game-review/${encodeURIComponent(game)}/reject`, send("POST", { reason, note: note || null }));

// The owner's games in review or not approved, fetched once for all their game cards (and again after a change).
let mineCache: Promise<Review[]> | null = null;
export function mine(fresh = false): Promise<Review[]> {
  if (fresh || !mineCache) mineCache = call<Review[]>(t(), "/game-review/mine").catch(() => []);
  return mineCache;
}

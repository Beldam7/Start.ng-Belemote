import type { Character } from "./character";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type User = { id: number; email: string; name: string | null; character: Character | null };
export type TokenResponse = { access_token: string; user: User };

async function post(path: string, body: unknown): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Request failed");
  return data;
}

export const register = (email: string, password: string, name?: string) =>
  post("/auth/register", { email, password, name });
export const login = (email: string, password: string) => post("/auth/login", { email, password });
export const googleLogin = (idToken: string) => post("/auth/google", { id_token: idToken });

// The user for a saved token, or null if the token is missing, expired or invalid.
export async function me(token: string | null): Promise<User | null> {
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : null;
}

// A game published with POST /games/publish. cover_url is its card picture (null = none yet).
// Something start.ng found while checking a game: code is for scripts, message for people.
export type Problem = { code: string; message: string; file: string | null };
// Why the latest push to a live game didn't go live (only in myGames, for the owner).
export type UpdateProblem = { commit: string; at: string; detail: string; errors: Problem[] };
// A leaderboard column, from the game's startng.json (or the plain "score").
export type BoardStat = { key: string; label: string; order: "highest" | "lowest"; format: "number" | "time" };
export type PublishedGame = {
  name: string; url: string; repo_url: string; by: string; updated_at: string; cover_url: string | null;
  leaderboard: BoardStat[] | null; // null: this game has no leaderboard
  description?: string | null; // one line from the game's startng.json, for its page on start.ng
  plays?: number; // opened from start.ng in the last 7 days (the homepage shows the most played)
  update_problem?: UpdateProblem | null;
  // Only for the owner (myGames): how start.ng is keeping the game up to date from its repo.
  checked_at?: string | null; // when the repo was last checked for a push (null: not yet)
  live_commit?: string | null; // the first 7 characters of the commit that's live (null: not known yet)
  updates_paused_until?: string | null; // set while GitHub's limit has paused all checking
};

export async function listGames(): Promise<PublishedGame[]> {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Could not load the games");
  return res.json();
}

// Scores: games send them through /connect (see games.ts), which adds the player's sign-in.
export type ScoreResult = { best: number; improved: boolean; rank: number; stats: Record<string, number | null> };
export type LeaderboardEntry = { rank: number; player_id: number; name: string; color: string | null; score: number; stats: Record<string, number | null> };

/** A game's run: a plain score, or its own stats from startng.json ({ stats: { waves: 5, kills: 10 } }). */
export async function submitScore(token: string | null, game: string, run: { score?: number; stats?: Record<string, unknown> }): Promise<ScoreResult> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(game)}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(run),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not save the score");
  return data;
}

/** A game session for the signed-in player: the key a game uses to call its player API. */
export async function getGameSession(token: string, game: string): Promise<{ session: string; expires_in: number } | null> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(game)}/session`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : null;
}

export async function getLeaderboard(game: string, limit = 10): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(game)}/leaderboard?limit=${limit}`);
  if (!res.ok) throw new Error("Could not load the leaderboard");
  return res.json();
}

// Multiplayer: a one-minute ticket into a game's live room, and the room's WebSocket address.
export type LiveTicket = { ticket: string; url: string };

export async function getLiveTicket(token: string | null, game: string): Promise<LiveTicket> {
  const path = `/games/${encodeURIComponent(game)}`;
  const res = await fetch(`${API_URL}${path}/ticket`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not join the game");
  return { ticket: data.ticket, url: `${API_URL.replace(/^http/, "ws")}${path}/live` };
}

export async function saveCharacter(token: string | null, character: Character): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me/character`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(character),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not save your character");
  return data;
}

// ---- the signed-in builder's own games (profile > Your games)

/** Only public GitHub repo links (same rule as the backend): https://github.com/<owner>/<repo>, optionally /tree/<branch>. */
export const GITHUB_REPO_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+?(?:\.git)?(?:\/tree\/[\w./-]+?)?\/?$/;

/** A publish start.ng refused, with every problem it found. */
export class PublishFailed extends Error {
  constructor(message: string, readonly problems: Problem[]) {
    super(message);
  }
}

/** Publish (or update) a game from a public GitHub repo. It goes live at <name>.start.ng. */
export async function publishGame(token: string | null, repoUrl: string): Promise<{ name: string; url: string; created: boolean; warnings: Problem[] }> {
  const res = await fetch(`${API_URL}/games/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PublishFailed(typeof data.detail === "string" ? data.detail : "Could not upload that game", Array.isArray(data.errors) ? data.errors : []);
  }
  return { ...data, warnings: data.warnings ?? [] };
}

// ---- approve links: a game published through the API without signing in waits for one of these

export type PendingGameInfo = { name: string; repo_url: string; expires_at: string; available: boolean };

export async function getPendingGame(code: string): Promise<PendingGameInfo> {
  const res = await fetch(`${API_URL}/games/publish/${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "This link has expired or was already used");
  return data;
}

/** Puts a waiting game live on your account. */
export async function approvePendingGame(token: string | null, code: string): Promise<{ name: string; url: string; created: boolean }> {
  const res = await fetch(`${API_URL}/games/publish/${encodeURIComponent(code)}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not put it live");
  return data;
}

export async function myGames(token: string | null): Promise<PublishedGame[]> {
  const res = await fetch(`${API_URL}/games/mine`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : [];
}

/** Like myGames, but a failed request throws instead of looking like "no games", so a refresh can keep what is on screen. */
export async function myGamesOrThrow(token: string | null): Promise<PublishedGame[]> {
  const res = await fetch(`${API_URL}/games/mine`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Could not load your games (${res.status})`);
  return res.json();
}

/** Take your game offline and free its name. */
export async function unpublishGame(token: string | null, name: string): Promise<void> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(name)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : "Could not remove that game");
  }
}

// Same limits as the backend (app/covers.py). It crops the picture to 640 x 400.
export const COVER_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_COVER_BYTES = 2 * 1024 * 1024;

/** Set your game's card picture (the file is sent as is). Returns the game with its new cover_url. */
export async function uploadCover(token: string | null, name: string, file: File): Promise<PublishedGame> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(name)}/cover`, {
    method: "PUT",
    headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not upload that picture");
  return data;
}

/** Remove the picture you uploaded; the game's own cover.png (if any) or the letter shows again. */
export async function removeCover(token: string | null, name: string): Promise<PublishedGame> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(name)}/cover`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not remove the picture");
  return data;
}

// ---- Games by independent creators: made and hosted outside start.ng, listed on the homepage.
export type IndieGame = {
  id: number; name: string; url: string; description: string; by: string;
  cover_path: string; // on the API, e.g. /indie/3/cover.webp
  created_at: string;
  mine: boolean; // the signed-in user added it (they can remove it)
  plays: number; // opened from start.ng in the last 7 days
};
export type IndieGameIn = { name: string; url: string; description: string; cover: string /* data URL */ };

export const indieCoverUrl = (g: IndieGame) => `${API_URL}${g.cover_path}`;

/** Newest first. The homepage asks for 4, the creators page for all. */
export async function listIndieGames(token: string | null, limit = 200, sort: "newest" | "popular" = "newest"): Promise<IndieGame[]> {
  const res = await fetch(`${API_URL}/indie?limit=${limit}&sort=${sort}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new Error("Could not load the games");
  return res.json();
}

/** One game by an independent creator (for its page on start.ng). Null when there's no game with that id. */
export async function getIndieGame(token: string | null, id: number): Promise<IndieGame | null> {
  const res = await fetch(`${API_URL}/indie/${id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not load the game");
  return res.json();
}

export async function submitIndieGame(token: string | null, game: IndieGameIn): Promise<IndieGame> {
  const res = await fetch(`${API_URL}/indie`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(game),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not add your game");
  return data;
}

export async function removeIndieGame(token: string | null, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/indie/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : "Could not remove it");
  }
}

/** Someone opened a game from start.ng: counted for "most played". Fire and forget, survives leaving the page. */
export function trackPlay(game: string) {
  const url = `${API_URL}/games/${encodeURIComponent(game)}/plays`;
  try {
    if (navigator.sendBeacon?.(url)) return;
  } catch { /* fall back to fetch */ }
  fetch(url, { method: "POST", keepalive: true }).catch(() => {});
}

/** Someone opened a game by an independent creator: counted for "most clicked". */
export function trackIndiePlay(id: number) {
  const url = `${API_URL}/indie/${id}/plays`;
  try {
    if (navigator.sendBeacon?.(url)) return;
  } catch { /* fall back to fetch */ }
  fetch(url, { method: "POST", keepalive: true }).catch(() => {});
}

// ---- Favorites: the games a signed-in player saved ("g:<name>" or "i:<id>"), newest first.
async function favoritesCall(token: string | null, path: string, init?: RequestInit): Promise<string[]> {
  const res = await fetch(`${API_URL}/favorites${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not reach your favorites");
  return res.json();
}

export const listFavorites = (token: string | null) => favoritesCall(token, "");
/** Adds the favorites a device saved before sign-in, and returns the full list. */
export const syncFavorites = (token: string | null, keys: string[]) => favoritesCall(token, "/sync", { method: "POST", body: JSON.stringify({ keys }) });
export const addFavorite = (token: string | null, key: string) => favoritesCall(token, `/${encodeURIComponent(key)}`, { method: "PUT" });
export const removeFavorite = (token: string | null, key: string) => favoritesCall(token, `/${encodeURIComponent(key)}`, { method: "DELETE" });

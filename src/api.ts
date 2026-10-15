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
export type PublishedGame = { name: string; url: string; repo_url: string; by: string; updated_at: string; cover_url: string | null };

export async function listGames(): Promise<PublishedGame[]> {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Could not load the games");
  return res.json();
}

// Scores: games send them through /connect (see games.ts), which adds the player's sign-in.
export type ScoreResult = { best: number; improved: boolean; rank: number };
export type LeaderboardEntry = { rank: number; player_id: number; name: string; color: string | null; score: number };

export async function submitScore(token: string | null, game: string, score: number): Promise<ScoreResult> {
  const res = await fetch(`${API_URL}/games/${encodeURIComponent(game)}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ score }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not save the score");
  return data;
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

/** Publish (or update) a game from a public GitHub repo. It goes live at <name>.start.ng. */
export async function publishGame(token: string | null, repoUrl: string): Promise<{ name: string; url: string; created: boolean }> {
  const res = await fetch(`${API_URL}/games/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Could not upload that game");
  return data;
}

export async function myGames(token: string | null): Promise<PublishedGame[]> {
  const res = await fetch(`${API_URL}/games/mine`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : [];
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

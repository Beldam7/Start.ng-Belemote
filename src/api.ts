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

// A game published with POST /games/publish.
export type PublishedGame = { name: string; url: string; repo_url: string; by: string; updated_at: string };

export async function listGames(): Promise<PublishedGame[]> {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Could not load the games");
  return res.json();
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

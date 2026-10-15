import { getLeaderboard, me, PublishedGame, submitScore } from "./api";
import { CharacterStyle, styleFor } from "./character";

// A homepage card for a game from GET /games (games published with POST /games/publish).
// The API only knows the name, so the title and colours are worked out from it:
// the same game always gets the same colours.
export type Game = { slug: string; title: string; url: string; host: string; by: string; colors: [string, string] };

const CARD_COLORS: [string, string][] = [
  ["#ffd400", "#e10600"],
  ["#1dd1a1", "#0c6e5a"],
  ["#a55eea", "#4b7bec"],
  ["#ff6b6b", "#f7b731"],
  ["#45aaf2", "#2b2f4a"],
  ["#fd9644", "#eb3b5a"],
];

export function toCard(game: PublishedGame): Game {
  let hash = 0;
  for (const ch of game.name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    slug: game.name,
    title: game.name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    url: game.url,
    host: new URL(game.url).host,
    by: game.by,
    colors: CARD_COLORS[hash % CARD_COLORS.length],
  };
}

// Games are static sites on <name>.start.ng. This is how start.ng shares the signed-in
// user with them: a game loads /connect in a hidden iframe and asks who is signed in.
// Games get the user's id, character name and style only, never the token or email.

const GAME_ORIGINS = [
  /^https:\/\/[a-z0-9-]+\.start\.ng$/,
  /^http:\/\/[a-z0-9-]+\.start\.localhost(:\d+)?$/, // local testing
];

export function isGameOrigin(origin: string) {
  return GAME_ORIGINS.some((re) => re.test(origin));
}

/** The ?return_to= URL if it points at a game, otherwise null (so it can't redirect anywhere else). */
export function gameReturnUrl(): string | null {
  const raw = new URLSearchParams(location.search).get("return_to");
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return isGameOrigin(url.origin) ? url.href : null;
  } catch {
    return null;
  }
}

// What games receive as the player's look. Players make it in the character creator;
// accounts without one get a starting look worked out from their id.
export type GameStyle = CharacterStyle;
export { styleFor };

// The game a message came from: lanedash.start.ng -> "lanedash". Taken from the origin the
// browser reports, never from the message, so a game can only save scores for itself.
const gameFromOrigin = (origin: string) => new URL(origin).hostname.split(".")[0];
const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

// What /connect answers. Every reply echoes the request's requestId.
type Message = { type: string; requestId?: unknown; score?: unknown; limit?: unknown };
const handlers: Record<string, (msg: Message, game: string) => Promise<object>> = {
  // { type: "startng:whoami" } -> { type: "startng:user", user: { id, name, style } | null }
  "startng:whoami": async () => {
    const user = await me(localStorage.getItem("token")).catch(() => null);
    return {
      type: "startng:user",
      user: user && {
        id: user.id,
        name: user.character?.name ?? user.name ?? "Player",
        style: user.character?.style ?? styleFor(user.id),
      },
    };
  },

  // { type: "startng:score", score } -> { type: "startng:scoreSaved", ok, result: { best, improved, rank } | error }
  "startng:score": async (msg, game) => {
    const token = localStorage.getItem("token");
    if (!token) return { type: "startng:scoreSaved", ok: false, error: "Sign in to save your score" };
    if (!Number.isSafeInteger(msg.score) || (msg.score as number) < 0) {
      return { type: "startng:scoreSaved", ok: false, error: "A score must be a whole number, 0 or more" };
    }
    try {
      return { type: "startng:scoreSaved", ok: true, result: await submitScore(token, game, msg.score as number) };
    } catch (err) {
      return { type: "startng:scoreSaved", ok: false, error: errorText(err, "Could not save the score") };
    }
  },

  // { type: "startng:leaderboard", limit? } -> { type: "startng:leaderboardData", ok, entries | error }
  "startng:leaderboard": async (msg, game) => {
    const limit = Number.isInteger(msg.limit) ? Math.min(Math.max(msg.limit as number, 1), 50) : 10;
    try {
      return { type: "startng:leaderboardData", ok: true, entries: await getLeaderboard(game, limit) };
    } catch (err) {
      return { type: "startng:leaderboardData", ok: false, error: errorText(err, "Could not load the leaderboard") };
    }
  },
};

/** Runs on /connect: answers games (and nobody else) about the signed-in player and scores. */
export function serveConnect() {
  window.addEventListener("message", async (e) => {
    const handle = handlers[e.data?.type];
    if (!isGameOrigin(e.origin) || !handle) return;
    const reply = await handle(e.data, gameFromOrigin(e.origin));
    (e.source as Window | null)?.postMessage({ ...reply, requestId: e.data.requestId }, e.origin);
  });
}

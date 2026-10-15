import { me, PublishedGame } from "./api";
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

/** Runs on /connect: answers "who is signed in?" from games, and nobody else. */
export function serveConnect() {
  window.addEventListener("message", async (e) => {
    if (!isGameOrigin(e.origin) || e.data?.type !== "startng:whoami") return;
    const user = await me(localStorage.getItem("token")).catch(() => null);
    const reply = {
      type: "startng:user",
      requestId: e.data.requestId,
      user: user && {
        id: user.id,
        name: user.character?.name ?? user.name ?? "Player",
        style: user.character?.style ?? styleFor(user.id),
      },
    };
    (e.source as Window | null)?.postMessage(reply, e.origin);
  });
}

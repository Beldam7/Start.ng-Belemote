import { me } from "./api";
import { CharacterStyle, styleFor } from "./character";

// Games shown on the homepage. Each one is served from its own folder at https://<slug>.start.ng
// Add a game by adding an entry; the homepage card styling applies to every entry, e.g.
// { slug: "mygame", title: "My Game", tagline: "One line about it.", genre: "Action", by: "githubname", colors: ["#ffd400", "#e10600"] }
export type Game = { slug: string; title: string; tagline: string; genre: string; by: string; colors: [string, string] };

export const games: Game[] = [];

export const gameUrl = (slug: string) => `https://${slug}.start.ng`;

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

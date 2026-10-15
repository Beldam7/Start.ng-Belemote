import { me } from "./api";

// Games shown on the homepage. Each one is served from its own folder at https://<slug>.start.ng
// Add a game by adding an entry; the homepage card styling applies to every entry, e.g.
// { slug: "mygame", title: "My Game", tagline: "One line about it.", genre: "Action", by: "githubname", colors: ["#ffd400", "#e10600"] }
export type Game = { slug: string; title: string; tagline: string; genre: string; by: string; colors: [string, string] };

export const games: Game[] = [];

export const gameUrl = (slug: string) => `https://${slug}.start.ng`;

// Games are static sites on <name>.start.ng. This is how start.ng shares the signed-in
// user with them: a game loads /connect in a hidden iframe and asks who is signed in.
// Games get the user's id, name and style only, never the token or email.

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

// Until start.ng stores styles, each account gets a fixed look worked out from its id.
// These field names and values are what games build against.
export type GameStyle = {
  primaryColor: string;
  secondaryColor: string;
  skinColor: string;
  hat: "none" | "cap" | "beanie" | "tophat" | "crown";
  accessory: "none" | "glasses" | "scarf" | "backpack";
};

const SHIRTS = ["#ff6b6b", "#1dd1a1", "#a55eea", "#4b7bec", "#f7b731", "#fd9644", "#26de81", "#eb3b5a", "#45aaf2", "#8854d0"];
const PANTS = ["#2b2f4a", "#222f3e", "#3d3d3d", "#4b6584", "#5f3dc4", "#0c6e5a"];
const SKIN = ["#8d5524", "#a0662f", "#c68642", "#e0ac69", "#f1c27d"];
const HATS: GameStyle["hat"][] = ["none", "cap", "beanie", "tophat", "crown"];
const ACCESSORIES: GameStyle["accessory"][] = ["none", "glasses", "scarf", "backpack"];

function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

export function styleFor(userId: number): GameStyle {
  const pick = <T,>(list: T[], salt: number) => list[hash(userId * 31 + salt) % list.length];
  return {
    primaryColor: pick(SHIRTS, 1),
    secondaryColor: pick(PANTS, 2),
    skinColor: pick(SKIN, 3),
    hat: pick(HATS, 4),
    accessory: pick(ACCESSORIES, 5),
  };
}

/** Runs on /connect: answers "who is signed in?" from games, and nobody else. */
export function serveConnect() {
  window.addEventListener("message", async (e) => {
    if (!isGameOrigin(e.origin) || e.data?.type !== "startng:whoami") return;
    const user = await me(localStorage.getItem("token")).catch(() => null);
    const reply = {
      type: "startng:user",
      requestId: e.data.requestId,
      user: user && { id: user.id, name: user.name ?? "Player", style: styleFor(user.id) },
    };
    (e.source as Window | null)?.postMessage(reply, e.origin);
  });
}

import { IndieGame } from "./api";

/** Words for an address: "Moon Garden!" -> "moon-garden". Same as the API's slugify (app/routers/pages.py). */
export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");

/** A creator's game page on start.ng: the id finds the game, the name is for people and search. */
export const indiePath = (g: Pick<IndieGame, "id" | "name">) => {
  const slug = slugify(g.name);
  return slug ? `/creators/${g.id}-${slug}` : `/creators/${g.id}`;
};

/** The game's own site, without "www.". */
export const hostOf = (url: string) => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } };

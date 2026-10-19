// Page titles, descriptions and link previews (Open Graph / Twitter cards).
//
// The app is client-rendered, but chat apps and search crawlers read the HTML they are served and
// often don't run JavaScript. So every page's tags live here once and are used twice:
//  - vite.config.ts writes one HTML file per page at build time (games.html, docs.html ...), which
//    nginx serves for that address, so a shared link shows the right preview;
//  - setSeo() keeps the tags right while someone moves around the app without a reload.
// Keep the paths in step with main.tsx and nginx.conf.

export const SITE_NAME = "start.ng";
export const DEFAULT_SITE_URL = "https://start.ng";
/** The picture shown in link previews (in public/). */
export const SHARE_IMAGE = "/hangout-cover.jpg";
export const SHARE_IMAGE_ALT = "A screenshot of the Hangout, start.ng's own multiplayer game";

export type Seo = {
  title: string;
  description: string;
  /** The page's address, without the site: "/games". */
  path: string;
  /** Keep the page out of search results (sign-in flows, 404). */
  noindex?: boolean;
};

const HOME_DESCRIPTION =
  "Play free browser games made by the HNG community, each at its own start.ng address. Build your character, climb the leaderboards, or publish your own game in minutes.";

export const PAGES: Record<string, Seo> = {
  home: { title: "start.ng · Good vibes. Good games.", description: HOME_DESCRIPTION, path: "/" },
  games: {
    title: "All games from the community · start.ng",
    description: "Browse and search every game built by the start.ng community. Pick one and play right in your browser, no download needed.",
    path: "/games",
  },
  creators: {
    title: "Games by independent creators · start.ng",
    description: "Discover games made and hosted by independent creators, from itch.io to their own sites. Search them all, or submit your own.",
    path: "/creators",
  },
  hangout: {
    title: "The Hangout · start.ng",
    description: "The Hangout is start.ng's own multiplayer park. Sign in as your character, walk around and meet everyone else who's there.",
    path: "/hangout",
  },
  docs: {
    title: "Docs: publish a game on start.ng",
    description: "How to publish a browser game on start.ng: push it to GitHub, make one API call, approve it once, and it's live at yourgame.start.ng with its own leaderboard.",
    path: "/docs",
  },
  tournament: {
    title: "Today's tournament · start.ng",
    description: "Every day, a few start.ng games for 24 hours and one winner. Share to enter, play, and climb the standings.",
    path: "/tournament",
  },
  leaderboard: {
    title: "Leaderboard · start.ng",
    description: "The best players on start.ng: points from the daily tournaments, all time and this week.",
    path: "/leaderboard",
  },
  // The plain page nginx falls back to for /games/<name> when the API can't render that game's page.
  game: {
    title: "Play free on start.ng",
    description: "Play free browser games made by the HNG community on start.ng.",
    path: "/games",
  },
  approve: {
    title: "Put your game live · start.ng",
    description: "Approve a game you published to start.ng and put it live at its own address.",
    path: "/",
    noindex: true,
  },
  notFound: {
    title: "Page not found · start.ng",
    description: "There's nothing at this address. Browse the games on start.ng instead.",
    path: "/",
    noindex: true,
  },
};

/** Pages that get their own HTML file at build time: [file name, page]. */
export const STATIC_PAGES: [string, Seo][] = [
  ["games.html", PAGES.games],
  ["creators.html", PAGES.creators],
  ["hangout.html", PAGES.hangout],
  ["docs.html", PAGES.docs],
  ["tournament.html", PAGES.tournament],
  ["leaderboard.html", PAGES.leaderboard],
  ["game.html", PAGES.game],
  ["approve.html", PAGES.approve],
  ["404.html", PAGES.notFound],
];

/** Pages that belong in sitemap.xml. */
export const SITEMAP_PATHS = ["home", "games", "creators", "tournament", "leaderboard", "hangout", "docs"].map((k) => PAGES[k].path);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The <head> tags for a page, as HTML. `site` is the public origin, like https://start.ng. */
export function headTags(seo: Seo, site: string): string {
  const url = site + (seo.path === "/" ? "/" : seo.path);
  const image = site + SHARE_IMAGE;
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="robots" content="${seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:alt" content="${esc(SHARE_IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];
  return tags.join("\n    ");
}

/** Structured data for the homepage, so search engines know what start.ng is. */
export function jsonLd(site: string): string {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: SITE_NAME, url: site + "/", logo: site + "/favicon.svg" },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: site + "/",
        description: HOME_DESCRIPTION,
        potentialAction: { "@type": "SearchAction", target: `${site}/games?q={search_term_string}`, "query-input": "required name=search_term_string" },
      },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

/** The public origin, from the same VITE_SITE_URL the build uses, so a preview or alternate host still points at the real address. */
function siteUrl(): string {
  return (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

/** Update the tags of the page that's open (when moving between pages or searching without a reload). */
export function setSeo(seo: Seo) {
  document.title = seo.title;
  const url = siteUrl() + seo.path;
  const robots = seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";
  const upsert = (tag: "meta" | "link", selector: string, attrs: Record<string, string>) => {
    let el = document.head.querySelector(selector);
    if (!el) document.head.appendChild((el = document.createElement(tag)));
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  };
  const meta = (key: "name" | "property", name: string, content: string) =>
    upsert("meta", `meta[${key}="${name}"]`, { [key]: name, content });
  meta("name", "description", seo.description);
  meta("name", "robots", robots);
  meta("property", "og:title", seo.title);
  meta("property", "og:description", seo.description);
  meta("property", "og:url", url);
  meta("name", "twitter:title", seo.title);
  meta("name", "twitter:description", seo.description);
  upsert("link", 'link[rel="canonical"]', { rel: "canonical", href: url });
}

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { DEFAULT_SITE_URL, headTags, jsonLd, PAGES, SITEMAP_PATHS, STATIC_PAGES } from "./src/seo";

// Link previews and search crawlers read the HTML they're served, so the build writes one HTML file
// per page (games.html, docs.html ...) with that page's title, description and Open Graph tags,
// plus robots.txt and sitemap.xml. nginx serves them (see nginx.conf). The tags come from src/seo.ts.
function seoPages(site: string): Plugin {
  const block = /<!--seo-->[\s\S]*?<!--\/seo-->/;
  return {
    name: "startng-seo",
    apply: "build",
    // The homepage's own tags go into index.html.
    transformIndexHtml: { order: "post", handler: (html) => html.replace(block, `<!--seo-->\n    ${headTags(PAGES.home, site)}\n    ${jsonLd(site)}\n    <!--/seo-->`) },
    closeBundle() {
      const out = resolve(__dirname, "dist");
      const index = readFileSync(resolve(out, "index.html"), "utf8");
      for (const [file, page] of STATIC_PAGES) {
        writeFileSync(resolve(out, file), index.replace(block, `<!--seo-->\n    ${headTags(page, site)}\n    <!--/seo-->`).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ""));
      }
      mkdirSync(out, { recursive: true });
      writeFileSync(resolve(out, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /approve/\nDisallow: /connect\n\nSitemap: ${site}/sitemap.xml\n`);
      const urls = SITEMAP_PATHS.map((p) => `  <url><loc>${site}${p}</loc></url>`).join("\n");
      writeFileSync(resolve(out, "sitemap.static.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    },
  };
}

export default defineConfig(({ mode }) => {
  // VITE_SITE_URL: the public address, for canonical links and previews (default https://start.ng).
  const site = (loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  return {
    plugins: [react(), seoPages(site)],
    // three.js (~520 kB) is split into its own chunk and only loads for the character creator and avatar.
    build: { chunkSizeWarningLimit: 600 },
  };
});

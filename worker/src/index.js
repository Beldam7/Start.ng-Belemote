// start.ng game host: serves static games from an R2 bucket.
// Rule: the subdomain is the folder name. dave.start.ng/x -> dave/x

export const CONTENT_TYPES = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  wasm: "application/wasm",
};

// Folder names: lowercase letters, digits, hyphens. No leading/trailing hyphen.
const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function parseList(value) {
  return (value || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" },
  });
}

// Returns the game name for a host, or null if the host is not a game host.
export function gameNameFromHost(hostname, baseDomain) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const suffix = "." + baseDomain.toLowerCase();
  if (!host.endsWith(suffix)) return null;
  return host.slice(0, -suffix.length);
}

// Turns a URL path into a safe bucket key under the game folder, or null.
export function keyForPath(name, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;

  const hasTrailingSlash = decoded.endsWith("/");
  const segments = decoded.split("/").filter((s) => s !== "");
  // Reject "..", ".", and hidden files such as ".git" or ".env".
  if (segments.some((s) => s.startsWith("."))) return null;

  const last = segments[segments.length - 1] || "";
  const isFile = !hasTrailingSlash && last.includes(".");
  const path = segments.join("/");
  if (isFile) return `${name}/${path}`;
  return path ? `${name}/${path}/index.html` : `${name}/index.html`;
}

function contentTypeFor(key, object) {
  const ext = key.split(".").pop().toLowerCase();
  return CONTENT_TYPES[ext] || object.httpMetadata?.contentType || "application/octet-stream";
}

export default {
  async fetch(request, env) {
    const baseDomain = env.BASE_DOMAIN || "start.ng";
    const reserved = parseList(env.RESERVED_NAMES);
    const url = new URL(request.url);
    const name = gameNameFromHost(url.hostname, baseDomain);

    // Not a subdomain of the base domain: leave the request alone.
    if (name === null) return fetch(request);
    // Reserved names are never served from the bucket. Send them on to wherever they live now.
    if (reserved.includes(name)) return fetch(request);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    // Only a single label is a game (a.b.start.ng is not).
    if (!NAME_RE.test(name)) return notFound();

    const key = keyForPath(name, url.pathname);
    if (!key) return notFound();

    const object = await env.GAMES_BUCKET.get(key);
    if (!object) return notFound();

    const headers = new Headers();
    headers.set("content-type", contentTypeFor(key, object));
    headers.set("x-content-type-options", "nosniff");
    headers.set("cache-control", env.CACHE_CONTROL || "public, max-age=60");
    if (object.httpEtag) headers.set("etag", object.httpEtag);

    return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
  },
};

// Publish a game from a GitHub repo so it plays at <name>.start.ng.
//
//   node scripts/publish-game.js <github-url> [options]
//
//   --name <name>       folder / subdomain name (default: the repo name)
//   --branch <branch>   branch to download (default: the repo's default branch)
//   --build             build the game if it has no built files yet. This runs the repo's own
//                       code (npm install + npm run build), so only use it for repos you trust.
//   --target local|r2   local (default): copy into a games folder for dev-server.js
//                       r2: upload to the Cloudflare R2 bucket with wrangler
//   --dir <folder>      games folder for --target local (default: ./local-games)
//   --bucket <name>     R2 bucket for --target r2 (default: bucket_name in wrangler.toml)
//
// A game is a folder of static files with an index.html. If the repo already has one built
// (dist/, build/, docs/, out/ or the repo root), that is what gets published.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_TYPES } from "../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(here, "..");

// Same rule as the Worker: lowercase letters, digits, hyphens, no hyphen at either end.
const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MAX_NAME = 40;
const RESERVED = (process.env.RESERVED_NAMES || "api,auth,login,www,3rdmainland").split(",").map((s) => s.trim());
const OUTPUT_DIRS = ["dist", "build", "docs", "out", "."];
const MAX_FILES = 2000;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const isWindows = process.platform === "win32";

class PublishError extends Error {}

function parseArgs(argv) {
  const args = { build: false, target: "local", dir: path.join(workerDir, "local-games") };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (!v) throw new PublishError(`${a} needs a value`);
      return v;
    };
    if (a === "--build") args.build = true;
    else if (a === "--name") args.name = value();
    else if (a === "--branch") args.branch = value();
    else if (a === "--target") args.target = value();
    else if (a === "--dir") args.dir = path.resolve(value());
    else if (a === "--bucket") args.bucket = value();
    else if (a.startsWith("--")) throw new PublishError(`Unknown option ${a}`);
    else rest.push(a);
  }
  if (rest.length !== 1) throw new PublishError("Usage: node scripts/publish-game.js <github-url> [options]");
  if (!["local", "r2"].includes(args.target)) throw new PublishError("--target must be local or r2");
  args.url = rest[0];
  return args;
}

// https://github.com/owner/repo, with optional .git or /tree/<branch>
export function parseRepoUrl(url) {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/tree\/([\w./-]+?))?\/?$/.exec(url.trim());
  if (!m) throw new PublishError(`Not a GitHub repo link: ${url}`);
  return { owner: m[1], repo: m[2], branch: m[3] };
}

export function gameName(raw) {
  const name = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_NAME)
    .replace(/-$/, "");
  if (!NAME_RE.test(name)) throw new PublishError(`"${raw}" can't be used as a game name`);
  if (RESERVED.includes(name)) throw new PublishError(`"${name}" is reserved, pick another name with --name`);
  return name;
}

function run(command, args, cwd) {
  // npm and npx are .cmd files on Windows and need a shell there; the args are fixed words or
  // quoted paths, so they are joined into one command line.
  const useShell = isWindows && command !== "git";
  const result = useShell
    ? spawnSync([command, ...args].join(" "), { cwd, stdio: "inherit", shell: true })
    : spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new PublishError(`${command} ${args.join(" ")} failed`);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// A Vite/webpack source index.html points at /src/*.ts(x) and can't run without building.
function looksBuilt(html) {
  return !/<script[^>]+src=["']\/?src\/[^"']+\.(tsx?|jsx)["']/i.test(html);
}

async function findBuiltGame(repoDir) {
  for (const dir of OUTPUT_DIRS) {
    const index = path.join(repoDir, dir, "index.html");
    if ((await exists(index)) && looksBuilt(await fs.readFile(index, "utf8"))) return path.join(repoDir, dir);
  }
  return null;
}

async function buildGame(repoDir) {
  const pkgPath = path.join(repoDir, "package.json");
  if (!(await exists(pkgPath))) return false;
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  if (!pkg.scripts?.build) return false;
  console.log("Building the game (npm install, npm run build)...");
  run("npm", [(await exists(path.join(repoDir, "package-lock.json"))) ? "ci" : "install", "--no-audit", "--no-fund"], repoDir);
  run("npm", ["run", "build"], repoDir);
  return true;
}

// Every file under dir, skipping hidden files, node_modules and links. Enforces size limits.
async function collectFiles(dir) {
  const files = [];
  let total = 0;
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const { size } = await fs.stat(full);
      if (size > MAX_FILE_BYTES) throw new PublishError(`${path.relative(dir, full)} is over ${MAX_FILE_BYTES / 1048576} MB`);
      total += size;
      files.push({ full, rel: path.relative(dir, full).split(path.sep).join("/"), size });
      if (files.length > MAX_FILES) throw new PublishError(`More than ${MAX_FILES} files`);
      if (total > MAX_TOTAL_BYTES) throw new PublishError(`The game is over ${MAX_TOTAL_BYTES / 1048576} MB`);
    }
  }
  await walk(dir);
  if (!files.some((f) => f.rel === "index.html")) throw new PublishError("No index.html in the game folder");
  return { files, total };
}

async function publishLocal(name, files, gamesDir) {
  const dest = path.join(gamesDir, name);
  await fs.rm(dest, { recursive: true, force: true });
  for (const f of files) {
    const target = path.join(dest, f.rel);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(f.full, target);
  }
  return `http://${name}.localhost:${process.env.PORT || 8787}/`;
}

async function bucketFromWrangler() {
  const toml = await fs.readFile(path.join(workerDir, "wrangler.toml"), "utf8");
  const m = /bucket_name\s*=\s*"([^"]+)"/.exec(toml);
  if (!m || m[1].includes("<")) throw new PublishError("Set the bucket: --bucket <name>, or bucket_name in wrangler.toml");
  return m[1];
}

// Uploads each file with wrangler. Files from an older version that the new one no longer has
// stay in the bucket; the Worker only serves what the game links to, so they are harmless.
async function publishR2(name, files, bucket) {
  for (const f of files) {
    const ext = f.rel.split(".").pop().toLowerCase();
    const type = CONTENT_TYPES[ext] || "application/octet-stream";
    console.log(`  ${f.rel}`);
    run("npx", ["wrangler", "r2", "object", "put", `${bucket}/${name}/${f.rel}`, "--file", JSON.stringify(f.full), "--content-type", JSON.stringify(type), "--remote"], workerDir);
  }
  return `https://${name}.start.ng/`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = parseRepoUrl(args.url);
  const name = gameName(args.name || repo.repo);
  const branch = args.branch || repo.branch;
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "startng-publish-"));
  const repoDir = path.join(temp, "repo");

  try {
    console.log(`Downloading ${repo.owner}/${repo.repo}${branch ? ` (${branch})` : ""}...`);
    run("git", ["clone", "--quiet", "--depth", "1", ...(branch ? ["--branch", branch] : []), `https://github.com/${repo.owner}/${repo.repo}.git`, repoDir], temp);

    let gameDir = await findBuiltGame(repoDir);
    if (!gameDir) {
      if (!args.build) {
        throw new PublishError(
          "No built game found (an index.html in dist/, build/, docs/, out/ or the root that runs without building).\n" +
            "Ask the owner to commit their built files, or rerun with --build if you trust the repo (it runs their code).",
        );
      }
      if (!(await buildGame(repoDir))) throw new PublishError("No built game and no build script in package.json");
      gameDir = await findBuiltGame(repoDir);
      if (!gameDir) throw new PublishError("Built, but found no index.html in dist/, build/, docs/ or out/");
    }

    const { files, total } = await collectFiles(gameDir);
    console.log(`Publishing ${files.length} files (${(total / 1048576).toFixed(1)} MB) from ${path.relative(repoDir, gameDir) || "the repo root"} as "${name}"...`);
    const url =
      args.target === "r2" ? await publishR2(name, files, args.bucket || (await bucketFromWrangler())) : await publishLocal(name, files, args.dir);
    console.log(`\nDone. Play it at ${url}`);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

// Run only when called directly, so the test file can import the helpers.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof PublishError ? `Error: ${err.message}` : err);
    process.exit(1);
  });
}

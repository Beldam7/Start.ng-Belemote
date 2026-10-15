# Build a game for start.ng

start.ng is a home for small browser games made by the community. Every game lives at its own address, like `yourgame.start.ng`, and every signed-in player brings their own start.ng character into every game.

This page is everything you need to build a start.ng game and put it live with the API, by hand or with your AI. If you're using an AI, give it this page as plain text: **https://start.ng/docs.md**.

> **For AI assistants:** follow this page exactly. Build a static game, push it to a public GitHub repo, call `POST https://api.start.ng/games/publish`, and show the human the `approve_url` from the reply if there is one. Everything you need is below.

## What a start.ng game is

- **A static website:** HTML, CSS, JavaScript, images, sounds and fonts. It runs entirely in the browser; there's no server code.
- **In a public GitHub repo,** with a ready-to-play `index.html` either at the top of the repo or in `dist/`, `build/`, `docs/` or `out/` (start.ng looks in that order).
- **Already built.** start.ng never runs your code or installs packages. If you use Vite, React or similar, build it and commit the built folder (for example `dist/`). A source `index.html` that loads `/src/main.ts` is refused with "needs building first".
- **Any game engine works,** as long as the result is static files: plain JavaScript, three.js, Phaser, PixiJS, Babylon.js and so on.

### Rules for the files

| Rule | Detail |
| --- | --- |
| Served file types | `html htm css js mjs json map txt svg png jpg jpeg gif webp avif ico woff woff2 ttf otf mp3 ogg wav mp4 webm wasm`. Other files are skipped (and listed in the reply) |
| Size | Up to 2,000 files and 100 MB in total, 25 MB per file |
| Left out | Hidden files and folders (`.git`, `.env`…), `node_modules`, links |
| Paths | Use **relative** paths (`src/game.js`, not `/src/game.js`) so the game works anywhere |
| Extra pages | Link to them with a trailing slash: `help/`, not `help` |
| Safety | Files are checked against known malware patterns before they go live |

### The name and address

Your game plays at `<name>.start.ng`. The name comes from `name` in the publish request, or from the repo name if you leave it out. It's turned into lowercase letters, numbers and hyphens (`Tower Stack` becomes `tower-stack`), at most 40 characters. `api`, `auth`, `login`, `www` and `3rdmainland` can't be used. The first person to put a name live owns it.

## Publish your game

```
POST https://api.start.ng/games/publish
Content-Type: application/json

{ "repo_url": "https://github.com/you/tower-stack", "name": "tower-stack" }
```

| Field | Required | Meaning |
| --- | --- | --- |
| `repo_url` | Yes | A **public** GitHub repo: `https://github.com/<owner>/<repo>`, optionally `/tree/<branch>` |
| `name` | No | The game's name and address. Defaults to the repo name |
| `branch` | No | Which branch to publish. Defaults to the repo's main branch |

No key or account is needed. What happens next depends on whether the repo is already live.

### A new game: approve it once

The first time you publish a repo, start.ng downloads it, checks it, and replies **202** with an approve link:

```json
{
  "status": "pending",
  "name": "tower-stack",
  "repo_url": "https://github.com/you/tower-stack",
  "approve_url": "https://start.ng/approve/7Q4K9XPA2M3b",
  "expires_at": "2026-11-14T10:00:00Z",
  "folder": "dist",
  "files": 14,
  "size_bytes": 812345,
  "skipped": ["README.md"],
  "message": "Checked and ready. Open https://start.ng/approve/7Q4K9XPA2M3b to sign in with start.ng and put it live on your account. ..."
}
```

**Open `approve_url`** (AI assistants: show it to the human and ask them to open it). It signs you in to start.ng, which creates your account if you're new, and asks *"Put tower-stack live?"*. Say yes and it's live at `https://tower-stack.start.ng` on your account. That repo is now linked to your account for good.

- The link works **once** and lasts **30 days**. If it runs out, publish again for a new one.
- Problems with the game (no `index.html`, too big…) come back **before** the link, so you never approve something that doesn't work.
- New games published without signing in are limited to 20 an hour per address.

### An approved game: updates go live straight away

Publishing a repo that's already live updates the game immediately, on its owner's account, with no link. The reply is **200**:

```json
{
  "name": "tower-stack",
  "url": "https://tower-stack.start.ng",
  "repo_url": "https://github.com/you/tower-stack",
  "created": false,
  "folder": "dist",
  "files": 15,
  "size_bytes": 830112,
  "skipped": []
}
```

You don't usually need to call it again, though: **start.ng watches the branch it published from and updates the game by itself after every push**, usually within a minute or two (games that haven't changed in a while are checked less often, up to once an hour). So the everyday loop is just: change the game, push to GitHub. If a push doesn't publish (say `index.html` went missing), the game stays as it was until a push that works.

Calling publish yourself updates the game right away. A repo can only update the game it's linked to; asking for a different `name` gives **409**.

Signed-in requests (`Authorization: Bearer <start.ng token>`, as the start.ng website sends) skip the approve step and go live on that account straight away.

### Errors

| Status | When | What to do |
| --- | --- | --- |
| 400 | The link isn't a public GitHub repo link, or the name can't be used | Fix `repo_url` or `name` |
| 409 | The name is taken, or this repo is live under another name | Pick another `name`, or leave it out to update the linked game |
| 422 | Something's wrong with the game: no `index.html`, needs building, too big, repo not found or not public… | Read `detail`, fix the repo, push, publish again |
| 429 | Too many new games from your address | Try again in an hour |
| 502 / 503 | start.ng couldn't upload right now, or publishing isn't set up | Try again later |

Every error has a `detail` message written for people.

### A cover picture

Your game's card on start.ng shows a cover picture. Put **`cover.png`** (or `cover.jpg` / `cover.webp`) next to your `index.html` and publish: start.ng picks it up automatically.

- **16:10**, at least **640 × 400** (1280 × 800 looks sharp). Cards crop to 16:10.
- PNG, JPEG or WebP, ideally under 2 MB.
- Make it look like the game, with its title on it. AI assistants: generate one, save it as `cover.png` next to `index.html`, and publish.
- Without one, the card shows the first letter of the game's name. The owner can also upload a cover from their start.ng profile; that one wins.

## Players and their character

start.ng handles sign-in. Your game never sees passwords or sign-in tokens: it asks start.ng who's playing through a hidden page, `https://start.ng/connect`, using the browser's `postMessage`. This only works when your game is served from a `*.start.ng` address, which publishing does for you.

### Talk to start.ng

Add this to your game once:

```js
// Talks to start.ng through its hidden connect page.
const START_NG = 'https://start.ng';
let frame;

function connectFrame() {
  frame ??= new Promise((resolve, reject) => {
    const el = document.createElement('iframe');
    el.src = `${START_NG}/connect`;
    el.hidden = true;
    el.onload = () => resolve(el);
    el.onerror = reject;
    document.body.append(el);
  });
  return frame;
}

// Sends a message and resolves to start.ng's reply, or null if it didn't answer.
async function askStartNg(message, replyType, timeoutMs = 5000) {
  const el = await connectFrame();
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2);
    const done = (reply) => { clearTimeout(timer); removeEventListener('message', onMessage); resolve(reply); };
    const timer = setTimeout(() => done(null), timeoutMs);
    function onMessage(e) {
      if (e.origin !== START_NG || e.source !== el.contentWindow) return;
      if (e.data?.type === replyType && e.data.requestId === requestId) done(e.data);
    }
    addEventListener('message', onMessage);
    el.contentWindow.postMessage({ ...message, requestId }, START_NG);
  });
}
```

Always check `e.origin` like this: it's what makes the reply trustworthy.

### Who's playing

```js
const reply = await askStartNg({ type: 'startng:whoami' }, 'startng:user');
const player = reply?.user ?? reply?.guest; // signed in, or start.ng's guest
```

The reply:

```json
{
  "type": "startng:user",
  "user": {
    "id": 42,
    "name": "Runner Tee",
    "account": "Hamzat",
    "style": { "body": "female", "primaryColor": "#a55eea", "secondaryColor": "#0c6e5a", "skinColor": "#8d5524", "hairColor": "#17120f", "hair": "braids", "hat": "crown", "accessory": "earrings" },
    "face": "data:image/png;base64,iVBORw0KGgo..."
  },
  "guest": { "name": "Guest", "style": { "...": "start.ng's guest look" }, "face": "data:image/png;base64,..." }
}
```

| Field | Meaning |
| --- | --- |
| `user` | The signed-in player, or `null` for a guest |
| `user.id` | Their start.ng id |
| `user.name` | Their **character's** name: show this in your game |
| `user.account` | Their account name, for a small `@name` |
| `user.style` | How their character looks (below) |
| `user.face` | A picture of their character's face (PNG data URL), for a profile card |
| `guest` | start.ng's one guest look and face, so guests look the same in every game |

Ask again when the player comes back to your tab (`visibilitychange` and `focus`): they may have signed in or out on start.ng.

### Sign in

Send the player to start.ng; it brings them back to your game afterwards:

```js
location.href = `https://start.ng/?return_to=${encodeURIComponent(location.href)}`;
```

The start.ng homepage asks signed-out players "sign in or play as a guest?" before opening a game. If they pick guest, your game opens with `?guest` in its address: skip your own sign-in question then.

### The character rule

**Every start.ng game shows the player's start.ng character.** That's what makes start.ng one place instead of many separate games.

- **Your game has a player character:** draw it from `style`, so it looks like it does on start.ng. Your art style can differ (pixel art, low-poly…), but keep the body, colours, hair, hat and accessory recognisable.
- **Your game has no character** (cards, puzzles, quizzes, strategy…): show a **profile card** at the top of the screen: the `face` picture, the character `name`, and `@account`. Style it to fit your game.
- **Guests:** use `guest` (the default look, named "Guest"), and offer a sign-in button.

Working examples: [Lane Dash](https://github.com/Blackburn0/HNG-Game) (a runner that dresses as your character) and [the Hangout](https://github.com/Blackburn0/startng-hangout) (start.ng's 3D park, where your full character walks around).

### Character style fields

| Field | Values |
| --- | --- |
| `body` | `female`, `male` |
| `primaryColor` | The top, `#rrggbb` |
| `secondaryColor` | Trousers or skirt, `#rrggbb` |
| `skinColor` | `#rrggbb` |
| `hairColor` | `#rrggbb` |
| `hair` | `short`, `afro`, `braids`, `bun`, `ponytail`, `dreads`, `bald` |
| `hat` | `none`, `cap`, `beanie`, `tophat`, `crown` |
| `accessory` | `none`, `glasses`, `earrings`, `beard`, `scarf`, `backpack` |

Fall back to something sensible for any missing or unknown value: start.ng may add more options later.

### A profile card, for games without a character

```html
<div class="startng-card" id="player-card" hidden>
  <img id="player-face" alt="">
  <div>
    <b id="player-name"></b>
    <span id="player-account"></span>
  </div>
  <button id="player-sign-in" hidden>Sign in</button>
</div>

<style>
  .startng-card { position: fixed; top: 16px; left: 16px; display: flex; align-items: center; gap: 12px;
    padding: 8px 16px 8px 8px; border-radius: 999px; background: #292a23; color: #fffefa; font-family: sans-serif; }
  .startng-card img { width: 48px; height: 48px; border-radius: 50%; background: #d8fd71; }
  .startng-card b { display: block; font-size: 16px; }
  .startng-card span { font-size: 12px; opacity: .7; }
  .startng-card button { margin-left: 8px; border: 0; border-radius: 999px; padding: 6px 12px; background: #d8fd71; font-weight: 700; cursor: pointer; }
</style>

<script type="module">
  // askStartNg is the helper from "Talk to start.ng".
  const reply = await askStartNg({ type: 'startng:whoami' }, 'startng:user');
  const player = reply?.user ?? reply?.guest;
  if (player) {
    document.getElementById('player-face').src = player.face;
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-account').textContent = reply.user?.account ? `@${reply.user.account}` : 'Not signed in';
    document.getElementById('player-sign-in').hidden = !!reply.user;
    document.getElementById('player-sign-in').onclick = () =>
      (location.href = `https://start.ng/?return_to=${encodeURIComponent(location.href)}`);
    document.getElementById('player-card').hidden = false;
  }
</script>
```

## Scores and leaderboards

Each game gets its own start.ng leaderboard: every signed-in player's **best** score, highest first.

```js
// Save a score (signed-in players only; whole numbers from 0 to 1,000,000,000).
const saved = await askStartNg({ type: 'startng:score', score: 1240 }, 'startng:scoreSaved');
// { ok: true, result: { best: 1500, improved: false, rank: 2 } }  or  { ok: false, error: "Sign in to save your score" }

// Read the top players (limit 1 to 50, default 10). Works for guests too.
const board = await askStartNg({ type: 'startng:leaderboard', limit: 10 }, 'startng:leaderboardData');
// { ok: true, entries: [{ rank: 1, player_id: 7, name: "Chioma", color: "#a55eea", score: 2400 }, ...] }
```

- start.ng works out which game a score belongs to from your game's address, so a game can only save its own scores.
- Highlight the player's own row by comparing `player_id` with `user.id`.
- Guests can see the leaderboard but can't save. Invite them to sign in.

## Multiplayer

For games where players see each other live, like the Hangout:

1. Get a one-minute ticket: `askStartNg({ type: 'startng:ticket' }, 'startng:ticketData')` → `{ ok, ticket, url }` (signed-in players only).
2. Open a WebSocket to `url` with `?ticket=` and the ticket added (URL-encoded), within a minute.
3. Exchange JSON messages:

| Direction | Message |
| --- | --- |
| You send | `{ "type": "move", "x", "z", "ry", "moving" }` (up to about 25 a second), `{ "type": "wave" }` (once a second at most) |
| You get first | `{ "type": "welcome", "you", "players": [...], "seats": [...] }` |
| You get after | `join`, `move`, `wave` and `leave` from everyone else |

Players are `{ id, name, style, seat, x, z, ry, moving }`, with names and looks from start.ng, so nobody can pretend to be someone else. Positions stay within ±60 metres. If the connection closes with code `4401`, the player needs to sign in; `4403`, the room is full; `4409`, they joined from another tab. Up to 50 players share a room. See [the Hangout](https://github.com/Blackburn0/startng-hangout) for a full example.

## Other endpoints

| Endpoint | What it returns |
| --- | --- |
| `GET https://api.start.ng/games` | Every live game: `[{ name, url, repo_url, by, updated_at, cover_url }]` |
| `GET https://api.start.ng/games/{name}/leaderboard?limit=10` | A game's top players |
| `GET https://api.start.ng/games/publish/{code}` | What's waiting at an approve link |

## Checklist before you publish

1. `index.html` is at the top of the repo, or in `dist/`, `build/`, `docs/` or `out/`, and runs without a build step.
2. Paths are relative, and every file type you need is on the served list.
3. The game asks start.ng who's playing (`startng:whoami`), and checks `e.origin`.
4. It shows the player's start.ng character, or a profile card if the game has no character.
5. Guests see the guest look and a way to sign in.
6. Scores, if any, go through `startng:score`; the leaderboard comes from `startng:leaderboard`.
7. There's a `cover.png` (16:10) next to `index.html`.
8. The repo is public on GitHub and pushed.
9. Publish, then open the `approve_url` the first time. After that, pushing to the branch is enough.

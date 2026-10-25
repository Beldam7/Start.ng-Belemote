import { useEffect, useState } from "react";
import { call } from "../../api";
import type { YourGameProps } from "../registry";

// F1, on each of the owner's games in Your games: install the start.ng GitHub App on the repo, so a push goes live
// straight away instead of at the next check. Nothing shows until the app is set up on the API (GITHUB_APP_SLUG).

let installUrl: Promise<string | null> | null = null;
const loadInstallUrl = () =>
  (installUrl ??= call<{ install_url: string | null }>(null, "/github/app").then((r) => r.install_url).catch(() => null));

export default function InstantUpdates({ game }: YourGameProps) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { loadInstallUrl().then(setUrl); }, []);
  if (!url || !game.repo_url.startsWith("https://github.com/")) return null;
  return (
    <p className="note instant-updates">
      Instant updates: <a href={url} target="_blank" rel="noreferrer">install the start.ng GitHub App on this repo ↗</a>.
      Without it, start.ng checks for pushes every few minutes.
    </p>
  );
}

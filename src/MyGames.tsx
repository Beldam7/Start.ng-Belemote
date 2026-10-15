import { KeyboardEvent, useEffect, useState } from "react";
import { GITHUB_REPO_RE, myGames, publishGame, PublishedGame, unpublishGame } from "./api";
import { toCard } from "./games";

const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** "Your games" in the profile: paste a GitHub repo link to put your game on start.ng, and manage your games. */
export default function MyGames() {
  const [games, setGames] = useState<PublishedGame[] | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem("token");

  const refresh = () => myGames(token).then(setGames);
  useEffect(() => {
    refresh();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function upload() {
    const link = url.trim();
    if (!GITHUB_REPO_RE.test(link)) {
      setError("Only GitHub repo links work, like https://github.com/you/your-game");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await publishGame(token, link);
      setNotice(`${res.created ? "Live" : "Updated"} at ${new URL(res.url).host}`);
      setUrl("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that game");
    } finally {
      setBusy(false);
    }
  }

  async function remove(name: string) {
    if (!window.confirm(`Take ${name} offline? Its address will be free for anyone to use.`)) return;
    setError("");
    setNotice("");
    try {
      await unpublishGame(token, name);
      setGames((list) => (list ?? []).filter((g) => g.name !== name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that game");
    }
  }

  // This sits inside the profile form, so Enter uploads instead of saving the profile.
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      upload();
    }
  };

  return (
    <section className="my-games">
      <div className="my-games-head">
        <h3>Your games</h3>
        <span>{games ? `${games.length} live` : ""}</span>
      </div>
      <p className="lead-sm">Paste your game's public GitHub repo link. It goes live at its own start.ng address.</p>
      <div className="upload-row">
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          onKeyDown={onKey}
          aria-label="GitHub repo link"
          aria-invalid={!!error}
        />
        <button type="button" onClick={upload} disabled={busy || !url.trim()}>{busy ? "Uploading..." : "Upload"}</button>
      </div>
      {error && <p className="error">{error}</p>}
      {notice && <p className="ok">{notice}</p>}

      <div className="game-cards">
        {games?.map((g) => {
          const card = toCard(g);
          return (
            <article key={g.name} className="game-card no-shot">
              <div className="game-card-body">
                <h4>{card.title}</h4>
                <div className="game-card-meta">
                  <span className="tag">Live</span>
                  <span>Updated {dateOf(g.updated_at)}</span>
                </div>
                <div className="game-card-links">
                  <a href={g.url} target="_blank" rel="noreferrer">Play ↗</a>
                  <a href={g.repo_url} target="_blank" rel="noreferrer">GitHub ↗</a>
                  <span>{card.host}</span>
                  <button type="button" className="link remove" onClick={() => remove(g.name)}>Remove</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

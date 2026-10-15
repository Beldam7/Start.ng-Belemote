import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import {
  COVER_TYPES, GITHUB_REPO_RE, MAX_COVER_BYTES, myGames, publishGame, PublishedGame, removeCover, unpublishGame, uploadCover,
} from "./api";
import { toCard } from "./games";

// A picture the owner uploaded (not the game's own cover.png), so it can be removed.
const isUploaded = (g: PublishedGame) => !!g.cover_url && new URL(g.cover_url).pathname === "/startng-cover.webp";

const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** "Your games" in the profile: paste a GitHub repo link to put your game on start.ng, and manage your games. */
export default function MyGames() {
  const [games, setGames] = useState<PublishedGame[] | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState<string | null>(null); // the game whose picture is uploading
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

  const replace = (game: PublishedGame) => setGames((list) => (list ?? []).map((g) => (g.name === game.name ? game : g)));

  async function changeCover(name: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still uploads
    if (!file) return;
    setError("");
    setNotice("");
    if (!COVER_TYPES.includes(file.type)) return setError("Use a PNG, JPEG or WebP picture");
    if (file.size > MAX_COVER_BYTES) return setError("The picture must be 2 MB or less");
    setCoverBusy(name);
    try {
      replace(await uploadCover(token, name, file));
      setNotice("Cover updated. It shows on the homepage too.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that picture");
    } finally {
      setCoverBusy(null);
    }
  }

  async function dropCover(name: string) {
    setError("");
    setNotice("");
    setCoverBusy(name);
    try {
      replace(await removeCover(token, name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the picture");
    } finally {
      setCoverBusy(null);
    }
  }

  // This sits inside the profile form, so Enter must not save the profile. It doesn't upload either
  // while the Upload button is disabled.
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.preventDefault();
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
          placeholder="Looking for an easy way out, huh?"
          aria-label="GitHub repo link"
          aria-invalid={!!error}
        />
        {/* Uploading from the profile is switched off for now: the button stays disabled. */}
        <button type="button" onClick={upload} disabled>{busy ? "Uploading..." : "Upload"}</button>
      </div>
      {error && <p className="error">{error}</p>}
      {notice && <p className="ok">{notice}</p>}

      <div className="game-cards">
        {games?.map((g) => {
          const card = toCard(g);
          return (
            <article key={g.name} className="game-card">
              <div className="art" style={{ background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})` }}>
                {card.cover ? <img src={card.cover} alt={`${card.title} cover`} /> : <span>{card.title.charAt(0)}</span>}
              </div>
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
                <div className="game-card-links cover-links">
                  <label className={coverBusy === g.name ? "cover-pick busy" : "cover-pick"}>
                    {coverBusy === g.name ? "Saving picture..." : card.cover ? "Change cover" : "Add cover"}
                    <input type="file" accept={COVER_TYPES.join(",")} disabled={coverBusy !== null} onChange={(e) => changeCover(g.name, e)} />
                  </label>
                  {isUploaded(g) && (
                    <button type="button" className="link" disabled={coverBusy !== null} onClick={() => dropCover(g.name)}>Remove cover</button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

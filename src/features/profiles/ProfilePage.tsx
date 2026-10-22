import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { PageProps } from "../registry";
import { PAGES, setSeo } from "../../seo";
import { styleFor } from "../../character";
import { dressed, useWorn } from "../wardrobe/dress";
import ProfileSections from "../ProfileSections";
import { badgeCatalog, getProfile, myProfile, saveSettings, type Badge, type Profile, type Settings } from "./api";
import "./profiles.css";

const Viewer = lazy(() => import("../../three/Viewer"));
const MyGames = lazy(() => import("../../MyGames"));

/** start.ng/p/<id>-<name> (and /me): a player's page. Only the name and character are public, never the email. */
export default function ProfilePage({ user, onSignIn, params }: PageProps) {
  const isMeRoute = params.id === undefined;
  const id = isMeRoute ? user?.id : Number(params.id);
  const [p, setP] = useState<Profile | null | undefined>(undefined); // null: no such page (or a private one)
  const [catalog, setCatalog] = useState<Badge[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const worn = useWorn(user && id === user.id ? user.id : null);

  useEffect(() => { setSeo(PAGES.profile); badgeCatalog().then(setCatalog).catch(() => {}); }, []);

  useEffect(() => {
    if (id === undefined) { setP(undefined); return; }
    let live = true;
    setError("");
    (isMeRoute ? myProfile() : getProfile(id))
      .then((got) => {
        if (!live) return;
        setP(got);
        document.title = `${got.name} · start.ng`;
        // Put the player's name in the address, like game pages do.
        if (location.pathname !== `/p/${got.slug}`) history.replaceState(null, "", `/p/${got.slug}`);
      })
      .catch((e) => live && (e instanceof Error && /No player page/.test(e.message) ? setP(null) : setError("Couldn't load this page. Try again in a moment.")));
    return () => { live = false; };
  }, [id, isMeRoute, user?.id]);

  useEffect(() => {
    // The editor (in the top bar's shell) saved a new look or name.
    const again = () => myProfile().then((got) => setP((cur) => (cur?.me ? got : cur))).catch(() => {});
    window.addEventListener("startng:profile-saved", again);
    return () => window.removeEventListener("startng:profile-saved", again);
  }, []);

  const look = useMemo(() => {
    const base = p?.character?.style ?? styleFor(p?.id ?? 0);
    return dressed(base, p?.me ? worn ?? [] : []);
  }, [p, worn]);

  async function change(changes: Partial<Settings>) {
    setSaving(true);
    setError("");
    try {
      const settings = await saveSettings(changes);
      setP((cur) => (cur ? { ...cur, settings } : cur));
      if (!changes.notice_seen) await myProfile().then(setP).catch(() => {}); // shows or hides the parts they switched
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save that"); } finally { setSaving(false); }
  }

  if (isMeRoute && !user) {
    return (
      <section className="container profile-page">
        <h1>Profile</h1>
        <p className="lead-sm">Sign in to see your profile: your level, streak, badges and best scores.</p>
        <button type="button" onClick={onSignIn}>Sign in</button>
      </section>
    );
  }
  if (p === undefined && !error) return <section className="container profile-page"><p className="board-sub">Loading...</p></section>;
  if (p === null) {
    return (
      <section className="container profile-page">
        <h1>No player page here</h1>
        <p className="lead-sm">This player doesn't exist, or keeps their page private.</p>
        <p><a className="btn" href="/games">Find games to play</a></p>
      </section>
    );
  }
  if (!p) return <section className="container profile-page"><p className="error" role="alert">{error}</p></section>;

  const earned = new Set(p.badges.map((b) => b.key));
  const s = p.settings;
  return (
    <section className="container profile-page">
      {p.me && s && !s.notice_seen && (
        <div className="profile-notice" role="status">
          <p>Your page is <b>public</b>: anyone with the link can see your name, character, level, badges and best scores. Never your email.</p>
          <button type="button" className="ghost" disabled={saving} onClick={() => change({ notice_seen: true })}>Got it</button>
        </div>
      )}
      <header className="profile-hero">
        <div className="profile-stage">
          <Suspense fallback={null}><Viewer style={look} className="profile-viewer" /></Suspense>
        </div>
        <div className="profile-who">
          <span className="profile-level">Level {p.level}</span>
          <h1>{p.name}</h1>
          <p className="lead-sm">{p.xp.toLocaleString()} XP{p.current_streak > 0 && <> · {p.current_streak}-day streak</>}</p>
          <div className="profile-actions">
            {p.me && <button type="button" onClick={() => window.dispatchEvent(new Event("startng:edit-profile"))}>Edit profile</button>}
            {p.me && <a className="btn ghost" href="/shop#wardrobe">My wardrobe</a>}
            {(!p.me || s?.public) && (
              <button type="button" className="ghost" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/p/${p.slug}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); }}>
                {copied ? "Link copied" : "Copy link"}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="profile-stats">
        <div><b>{p.current_streak}</b><span>day streak</span></div>
        <div><b>{p.best_streak}</b><span>best streak</span></div>
        <div><b>{p.games_played}</b><span>games played</span></div>
        <div><b>{p.tournament_wins}</b><span>tournament wins</span></div>
        <div><b>{p.tournament_points}</b><span>tournament points</span></div>
      </div>

      <h2>Badges <span className="note">{p.badges.length}{catalog.length ? ` of ${catalog.length}` : ""}</span></h2>
      <ul className="badge-list">
        {catalog.map((b) => (
          <li key={b.key} className={earned.has(b.key) ? "badge on" : "badge"} title={b.description}>
            <b>{b.name}</b>
            <span>{earned.has(b.key) ? b.description : `Locked: ${b.description}`}</span>
          </li>
        ))}
        {catalog.length === 0 && p.badges.map((b) => <li key={b.key} className="badge on"><b>{b.name}</b><span>{b.description}</span></li>)}
      </ul>

      <div className="profile-cols">
      {p.bests && p.bests.length > 0 && (
        <div>
          <h2>Best scores</h2>
          <div className="profile-list">
            {p.bests.map((b) => (
              <a key={b.game} href={`/games/${b.game}`}><span>{b.title}</span><b>{b.best}</b>{b.rank && <em>#{b.rank}</em>}</a>
            ))}
          </div>
        </div>
      )}
      {p.most_played.length > 0 && (
        <div>
          <h2>Most played</h2>
          <div className="profile-list">
            {p.most_played.map((m) => <a key={m.game} href={`/games/${m.game}`}><span>{m.title}</span><b>{m.runs} {m.runs === 1 ? "run" : "runs"}</b></a>)}
          </div>
        </div>
      )}
      </div>
      {p.favorites && p.favorites.length > 0 && (
        <>
          <h2>Favorites</h2>
          <div className="profile-list">
            {p.favorites.map((f) => <a key={f.game} href={`/games/${f.game}`}><span>{f.title}</span></a>)}
          </div>
        </>
      )}

      <ProfileSections userId={p.id} isMe={p.me} />

      {p.me && <Suspense fallback={null}><MyGames /></Suspense>}

      {p.me && s && (
        <fieldset className="profile-settings" disabled={saving}>
          <legend>Privacy</legend>
          <label><input type="checkbox" checked={s.public} onChange={(e) => change({ public: e.target.checked })} /> Anyone with the link can see my page</label>
          <label><input type="checkbox" checked={s.show_ranks} onChange={(e) => change({ show_ranks: e.target.checked })} /> Show my best scores and ranks</label>
          <label><input type="checkbox" checked={s.show_favorites} onChange={(e) => change({ show_favorites: e.target.checked })} /> Show my favorites</label>
          <p className="note">{s.public ? `Share it: ${location.origin}/p/${p.slug}` : "Your page is private: only you can see it."}</p>
        </fieldset>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

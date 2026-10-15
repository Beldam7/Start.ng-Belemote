import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, me, saveCharacter, TokenResponse, User } from "./api";
import { AvatarFace } from "./Avatar";
import { Character, styleFor } from "./character";
import CharacterCreator from "./CharacterCreator";
import { gameReturnUrl, gameUrl, games } from "./games";

// Set when a game sent the user here to sign in: we send them back afterwards.
const returnTo = gameReturnUrl();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(() => !!localStorage.getItem("token"));
  // Sign-in is Google only; the first Google sign-in creates the account.
  const [signInOpen, setSignInOpen] = useState(!!returnTo);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the profile menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  // Restore the session from the saved token, so a refresh keeps you signed in.
  useEffect(() => {
    if (!checking) return;
    me(localStorage.getItem("token"))
      .then((u) => {
        if (u) setUser(u);
        else localStorage.removeItem("token");
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [checking]);

  useEffect(() => {
    // Back to the game once signed in and the character exists.
    if (user?.character && returnTo) location.replace(returnTo);
  }, [user]);

  function onSuccess(res: TokenResponse) {
    localStorage.setItem("token", res.access_token);
    setUser(res.user);
    setSignInOpen(false);
    setError("");
  }

  function signOut() {
    localStorage.removeItem("token");
    setUser(null);
    setEditing(false);
    setMenuOpen(false);
  }

  async function onSaveCharacter(c: Character) {
    setUser(await saveCharacter(localStorage.getItem("token"), c));
    setEditing(false);
  }

  const firstName = (user?.name ?? user?.email ?? "").split(/[ @]/)[0];

  return (
    <>
      <header className="container nav">
        <a className="logo" href="/"><b>start<span>.ng</span></b></a>
        <nav>
          <a href="#games">Games</a>
          <a href="#how">How it works</a>
          {user ? (
            <div className="me" ref={menuRef}>
              <button className="me-button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Your account">
                <AvatarFace style={user.character?.style ?? styleFor(user.id)} size={40} />
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="menu-head">
                    <AvatarFace style={user.character?.style ?? styleFor(user.id)} size={44} />
                    <div>
                      <strong>{user.character?.name ?? firstName}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <button role="menuitem" onClick={() => { setEditing(true); setMenuOpen(false); }}>View profile</button>
                  <button role="menuitem" onClick={signOut}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setSignInOpen(true)}>Sign in</button>
          )}
        </nav>
      </header>

      <main>
        <section className="container hero">
          <p className="eyebrow">Big imagination. Played everywhere.</p>
          <h1>Good vibes.<br /><mark>Good games.</mark></h1>
          <p className="lead">
            Games made by builders in the community.{" "}<br />
            Each one lives at its own address, like <code>yourgame.start.ng</code>.{" "}<br />
            Pick one and play right in your browser.
          </p>
          <div className="actions">
            <a className="btn" href="#games">Play now</a>
            {!user && <button className="ghost" onClick={() => setSignInOpen(true)}>Create free account</button>}
          </div>
        </section>

        <section id="games" className="container">
          <div className="section-head">
            <h2>Games</h2>
            <span className="count">{games.length} to play</span>
          </div>
          {games.length === 0 && (
            <p className="empty">
              No games yet. The first ones from the community are on their way. <a href="#how">Put yours here.</a>
            </p>
          )}
          <div className="grid">
            {games.map((g) => (
              <a key={g.slug} className="game" href={gameUrl(g.slug)} target="_blank" rel="noreferrer">
                <div className="art" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}>
                  <span>{g.title.charAt(0)}</span>
                </div>
                <div className="info">
                  <h3>{g.title}</h3>
                  <p>{g.tagline}</p>
                  <div className="meta">
                    <span className="tag">{g.genre}</span>
                    <span>by {g.by}</span>
                    <span className="play">Play ↗</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="how" className="container how">
          <h2>Got a game? Put it on start.ng</h2>
          <ol>
            <li><b>Build it</b><span>Any browser game works: HTML, JavaScript, three.js, anything static.</span></li>
            <li><b>Upload it</b><span>Put your built files in a folder named after your game, with index.html at the top.</span></li>
            <li><b>It's live</b><span>Your game appears at <code>yourgame.start.ng</code> for everyone to play.</span></li>
          </ol>
        </section>
      </main>

      <footer className="container footer">
        <span>start<span>.ng</span></span>
        <span>Built by the HNG community</span>
      </footer>

      {user && (!user.character || editing) && (
        <CharacterCreator
          initial={user.character ?? { name: firstName.slice(0, 24) || "Player", style: styleFor(user.id) }}
          editing={!!user.character}
          email={user.email}
          onSave={onSaveCharacter}
          onCancel={() => setEditing(false)}
        />
      )}

      {signInOpen && !user && !checking && (
        <div className="overlay" onClick={() => setSignInOpen(false)}>
          <div className="card" role="dialog" aria-modal="true" aria-labelledby="sign-in-title" onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h3 id="sign-in-title">Sign in to start.ng</h3>
              <button type="button" className="link close" aria-label="Close" onClick={() => setSignInOpen(false)}>✕</button>
            </div>
            <p className="note">
              {returnTo ? `Sign in to continue to ${new URL(returnTo).host}.` : "Use your Google account. New here? Signing in creates your account."}
            </p>
            {error && <p className="error">{error}</p>}
            <div className="google">
              <GoogleLogin
                onSuccess={async (c) => {
                  try { onSuccess(await googleLogin(c.credential ?? "")); }
                  catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed"); }
                }}
                onError={() => setError("Google sign-in failed")}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { FormEvent, useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, login, me, register, TokenResponse, User } from "./api";
import { gameUrl, games } from "./games";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Stay signed in after a refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) me(token).then(setUser).catch(() => localStorage.removeItem("token"));
  }, []);

  function onSuccess(res: TokenResponse) {
    localStorage.setItem("token", res.access_token);
    setUser(res.user);
    setMode(null);
    setError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      onSuccess(mode === "register" ? await register(email, password, name || undefined) : await login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function signOut() {
    localStorage.removeItem("token");
    setUser(null);
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
            <span className="me">
              <span className="avatar">{firstName.charAt(0).toUpperCase()}</span>
              <button className="link" onClick={signOut}>Sign out</button>
            </span>
          ) : (
            <button onClick={() => setMode("login")}>Sign in</button>
          )}
        </nav>
      </header>

      <main>
        <section className="container hero">
          <p className="eyebrow">Made in Nigeria. Played everywhere.</p>
          <h1>{user ? <>Welcome back,<br /><mark>{firstName}.</mark></> : <>Good vibes.<br /><mark>Good games.</mark></>}</h1>
          <p className="lead">
            Games made by builders in the community.{" "}<br />
            Each one lives at its own address, like <code>relichunter.start.ng</code>.{" "}<br />
            Pick one and play right in your browser.
          </p>
          <div className="actions">
            <a className="btn" href="#games">Play now</a>
            {!user && <button className="ghost" onClick={() => setMode("register")}>Create free account</button>}
          </div>
        </section>

        <section id="games" className="container">
          <div className="section-head">
            <h2>Games</h2>
            <span className="count">{games.length} to play</span>
          </div>
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

      {mode && !user && (
        <div className="overlay" onClick={() => setMode(null)}>
          <form className="card" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
            <div className="card-head">
              <h3>{mode === "register" ? "Create your account" : "Welcome back"}</h3>
              <button type="button" className="link close" aria-label="Close" onClick={() => setMode(null)}>✕</button>
            </div>
            {mode === "register" && <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            {error && <p className="error">{error}</p>}
            <button type="submit">{mode === "register" ? "Create account" : "Sign in"}</button>
            <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
            </button>
            <div className="divider">or</div>
            <div className="google">
              <GoogleLogin
                onSuccess={async (c) => {
                  try { onSuccess(await googleLogin(c.credential ?? "")); }
                  catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed"); }
                }}
                onError={() => setError("Google sign-in failed")}
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
}

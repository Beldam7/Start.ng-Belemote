import { FormEvent, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { googleLogin, login, register, TokenResponse, User } from "./api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "register" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className="container">
      <nav>
        <span className="logo">start.ng</span>
        {user ? (
          <button className="link" onClick={() => { localStorage.removeItem("token"); setUser(null); }}>
            Sign out ({user.email})
          </button>
        ) : (
          <button onClick={() => setMode("login")}>Sign in</button>
        )}
      </nav>

      <section className="hero">
        <h1>Welcome to Start.ng</h1>
        <p>Your starting point for building in Nigeria. Sign in to get going.</p>
        {user && <p>You are signed in as {user.name ?? user.email}.</p>}
      </section>

      {mode && !user && (
        <form className="card" onSubmit={submit}>
          {mode === "register" && <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {error && <p className="error">{error}</p>}
          <button type="submit">{mode === "register" ? "Create account" : "Sign in"}</button>
          <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "No account? Register" : "Have an account? Sign in"}
          </button>
          <div className="divider">or</div>
          <GoogleLogin
            onSuccess={async (c) => {
              try { onSuccess(await googleLogin(c.credential ?? "")); }
              catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed"); }
            }}
            onError={() => setError("Google sign-in failed")}
          />
        </form>
      )}
    </div>
  );
}

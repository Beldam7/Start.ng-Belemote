const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type User = { id: number; email: string; name: string | null };
export type TokenResponse = { access_token: string; user: User };

async function post(path: string, body: unknown): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Request failed");
  return data;
}

export const register = (email: string, password: string, name?: string) =>
  post("/auth/register", { email, password, name });
export const login = (email: string, password: string) => post("/auth/login", { email, password });
export const googleLogin = (idToken: string) => post("/auth/google", { id_token: idToken });

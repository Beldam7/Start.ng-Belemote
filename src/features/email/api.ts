import { call, send } from "../../api";

export type Topic = { key: string; label: string; on: boolean };
export type MyEmail = { email: string; topics: Topic[]; bad: boolean };
export type Done = { email: string; topics: string[] };
export type OutboxRow = {
  id: number; to: string; kinds: string[]; subject: string | null; status: string; attempts: number;
  last_error: string | null; created_at: string; sent_at: string | null;
};
export type Outbox = {
  provider: string; only_to: string[]; counts: Record<string, number>; subscribers: number;
  by_topic: Record<string, number>; rows: OutboxRow[];
};

// What a visitor (not signed in) can ask for. Labels match the API's topics.
export const VISITOR_TOPICS: { key: string; label: string }[] = [
  { key: "tournament", label: "The daily tournament: when it starts and ends" },
  { key: "new_games", label: "New games, once a week" },
  { key: "newsletter", label: "The start.ng newsletter (at most every 2 weeks)" },
];

const t = () => localStorage.getItem("token");
export const mine = () => call<MyEmail>(t(), "/email/me");
export const setMine = (topics: string[]) => call<MyEmail>(t(), "/email/me", send("PUT", { topics }));
export const subscribe = (email: string, topics: string[]) => call<{ detail: string }>(null, "/email/subscribe", send("POST", { email, topics }));
export const confirm = (token: string) => call<Done>(null, "/email/confirm", send("POST", { token }));
export const unsubscribe = (token: string, topic: string | null) => call<Done>(null, "/email/unsubscribe", send("POST", { token, topic }));
export const outbox = (status?: string) => call<Outbox>(t(), `/admin/email${status ? `?status=${encodeURIComponent(status)}` : ""}`);
export const sendTest = () => call<OutboxRow>(t(), "/admin/email/test", send("POST"));

export type Letter = {
  id: number; subject: string; body: string; created_by: string; updated_at: string;
  sent_at: string | null; sent_by: string | null; recipients: number | null; preview_html: string;
};
export type Newsletters = { audience: number; every_days: number; last_sent_at: string | null; letters: Letter[] };

export const newsletters = () => call<Newsletters>(t(), "/admin/newsletters");
export const saveLetter = (subject: string, body: string, id?: number) =>
  call<Letter>(t(), id ? `/admin/newsletters/${id}` : "/admin/newsletters", send(id ? "PUT" : "POST", { subject, body }));
export const deleteLetter = (id: number) => call<void>(t(), `/admin/newsletters/${id}`, send("DELETE"));
export const testLetter = (id: number) => call<{ to: string }>(t(), `/admin/newsletters/${id}/test`, send("POST"));
export const sendLetter = (id: number, force = false) => call<Letter>(t(), `/admin/newsletters/${id}/send`, send("POST", { force }));

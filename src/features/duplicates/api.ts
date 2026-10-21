import { call, send } from "../../api";

export type Side = { name: string; url: string; cover_url: string | null; owner_id: number; owner: string; created_at: string; hidden: string | null };
export type Reason = "same_page" | "same_cover" | "same_files" | "similar_name";
export type Pair = { a: Side; b: Side; reasons: Reason[]; same_owner: boolean };
export type Hidden = { game: Side; of: string | null; decided_by: string; decided_at: string };

const t = () => localStorage.getItem("token");
const g = (name: string) => encodeURIComponent(name);
export const pairs = () => call<Pair[]>(t(), "/admin/duplicates");
export const hiddenCopies = () => call<Hidden[]>(t(), "/admin/duplicates/hidden");
export const scan = () => call<{ scanned: number }>(t(), "/admin/duplicates/scan", send("POST"));
export const keep = (a: string, b: string) => call<void>(t(), "/admin/duplicates/keep", send("POST", { a, b }));
export const hide = (name: string, of: string) => call<void>(t(), `/admin/duplicates/games/${g(name)}/hide`, send("POST", { of }));
export const show = (name: string) => call<void>(t(), `/admin/duplicates/games/${g(name)}/show`, send("POST"));
export const remove = (name: string) => call<void>(t(), `/admin/duplicates/games/${g(name)}`, send("DELETE"));

let mineCache: Promise<{ game: string; of: string | null }[]> | null = null;
export function mine(): Promise<{ game: string; of: string | null }[]> {
  mineCache ??= call<{ game: string; of: string | null }[]>(t(), "/duplicates/mine").catch(() => []);
  return mineCache;
}

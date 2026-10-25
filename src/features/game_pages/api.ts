// A game's own pages (Chloe): API calls (startng-be app/features/game_pages).
import { call, send } from "../../api";

export type SubPage = { kind: string; label: string; path: string };
export type PageRow = { id: number; game: string; kind: string; status: "draft" | "approved" | "skipped"; title: string; reason: string | null; edited: boolean; generated_at: string };
export type PageFull = PageRow & { description: string; body: string; facts: Record<string, unknown> | null };
export type Summary = { draft: number; approved: number; skipped: number; games_without_pages: number };
export type Gap = { game: string; reasons: string[] };

const token = () => localStorage.getItem("token");

export const getSubPages = (game: string) => call<SubPage[]>(token(), `/games/${encodeURIComponent(game)}/pages`);
/** The pages of a game by an independent creator (its About and FAQ), by the game's id. */
export const getIndieSubPages = (id: string) => call<SubPage[]>(token(), `/indie/${encodeURIComponent(id)}/pages`);

// admin
export const PAGE_SIZE = 500; // the most the API returns at once; ask again with an offset for the rest
export const adminPages = (status: string, offset = 0) => call<PageRow[]>(token(), `/admin/game-pages?status=${status}&limit=${PAGE_SIZE}&offset=${offset}`);
export const adminSummary = () => call<Summary>(token(), "/admin/game-pages/summary");
export const adminGaps = () => call<Gap[]>(token(), "/admin/game-pages/gaps");
export const adminPage = (id: number) => call<PageFull>(token(), `/admin/game-pages/${id}`);
export const adminSave = (id: number, title: string, description: string, body: string) => call<PageFull>(token(), `/admin/game-pages/${id}`, send("PUT", { title, description, body }));
export const adminApprove = (id: number) => call<PageRow>(token(), `/admin/game-pages/${id}/approve`, send("POST"));
export const adminUnapprove = (id: number) => call<PageRow>(token(), `/admin/game-pages/${id}/unapprove`, send("POST"));
export const adminGenerate = (force = false) => call<Record<string, number>>(token(), "/admin/game-pages/generate", send("POST", { force }));

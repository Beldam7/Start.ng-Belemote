// Discovery (PRD A1): API calls (startng-be app/features/discovery).
import { call, send } from "../../api";

export type Shelves = {
  featured: string[]; staff: string[]; new: string[]; most_played: string[]; most_improved: string[]; continue_playing: string[];
};
export type Check = { key: string; label: string; ok: boolean; required: boolean };
export type Featuring = { featured: boolean; staff_pick: boolean; eligible: boolean; checks: Check[] };
export type AdminGame = { game: string; title: string; eligible: boolean; missing: string[] };
export type AdminFeatured = { featured: AdminGame[]; staff: AdminGame[]; candidates: AdminGame[] };

const token = () => localStorage.getItem("token");

export const getShelves = () => call<Shelves>(token(), "/discover/shelves");
export const getNext = (after: string) => call<{ games: string[]; tournament?: string | null }>(token(), `/discover/next?after=${encodeURIComponent(after)}`);
export const getFeaturing = (game: string) => call<Featuring>(token(), `/games/${encodeURIComponent(game)}/featuring`);
export const adminFeatured = () => call<AdminFeatured>(token(), "/admin/featured");
export const addFeatured = (shelf: string, game: string) => call<void>(token(), `/admin/featured/${shelf}/${encodeURIComponent(game)}`, send("PUT"));
export const removeFeatured = (shelf: string, game: string) => call<void>(token(), `/admin/featured/${shelf}/${encodeURIComponent(game)}`, send("DELETE"));
export const moveFeatured = (shelf: string, game: string, direction: "up" | "down") =>
  call<void>(token(), `/admin/featured/${shelf}/${encodeURIComponent(game)}/move?direction=${direction}`, send("POST"));

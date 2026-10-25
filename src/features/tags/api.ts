// Tags (Chloe): API calls (startng-be app/features/tags).
import { call, send, type PublishedGame } from "../../api";

export type Tag = { slug: string; label: string; blurb: string; group: string; games: number };
export type TagGroup = { name: string; tags: Tag[] };
export type TagsData = { total_games: number; groups: TagGroup[] };
export type TagPage = { tag: Tag; games: PublishedGame[]; page: number; pages: number; related: Tag[] };
export type ReviewRow = { game: string; approved: string[]; suggested: string[]; requested?: string[] };

const token = () => localStorage.getItem("token");

export type Choice = { slug: string; label: string };
export type ChoiceGroup = { name: string; tags: Choice[] };
/** The categories a creator can pick from (the submit form for independent games). */
export const getChoices = () => call<ChoiceGroup[]>(token(), "/tags/choices");

export const getTags = () => call<TagsData>(token(), "/tags");
export const getTagPage = (slug: string, page: number) => call<TagPage>(token(), `/tags/${encodeURIComponent(slug)}?page=${page}`);
export const getGameTags = (game: string) => call<{ slug: string; label: string }[]>(token(), `/games/${encodeURIComponent(game)}/tags`);

// admin
export const adminTags = () => call<Tag[]>(token(), "/admin/tags");
export const adminReview = (pending: boolean) => call<ReviewRow[]>(token(), `/admin/tags/review?pending=${pending}&limit=500`);
export const adminSuggest = () => call<{ added: number }>(token(), "/admin/tags/suggest", send("POST"));
export const adminSetTags = (game: string, tags: string[]) => call<string[]>(token(), `/admin/games/${encodeURIComponent(game)}/tags`, send("PUT", { tags }));

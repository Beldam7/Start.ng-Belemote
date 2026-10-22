import { call, send } from "../../api";

export type Word = { id: number | null; word: string; kind: "block" | "allow"; strong: boolean; built_in: boolean; added_by: string | null; created_at: string | null };
export type Flagged = { kind: "game" | "game_description" | "character" | "creators_listing"; name: string; word: string; target: string; owner: string | null };

const t = () => localStorage.getItem("token");
export const listWords = () => call<Word[]>(t(), "/admin/moderation/words");
export const addWord = (word: string, kind: "block" | "allow", strong: boolean) => call<Word>(t(), "/admin/moderation/words", send("POST", { word, kind, strong }));
export const removeWord = (id: number) => call<void>(t(), `/admin/moderation/words/${id}`, send("DELETE"));
export const tryText = (text: string) => call<{ ok: boolean; word: string | null }>(t(), "/admin/moderation/try", send("POST", { text }));
export const flaggedNames = () => call<Flagged[]>(t(), "/admin/moderation/flagged");

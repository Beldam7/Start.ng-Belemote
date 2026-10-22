// Player profiles and badges (PRD S1): API calls (startng-be app/features/profiles).
import { call, send } from "../../api";
import type { Character } from "../../character";

export type Settings = { public: boolean; show_favorites: boolean; show_ranks: boolean; notice_seen: boolean };
export type Badge = { key: string; name: string; description: string; earned_at: string | null };
export type Profile = {
  id: number; slug: string; name: string; character: Character | null; level: number; xp: number;
  current_streak: number; best_streak: number; games_played: number; runs: number; badges: Badge[];
  bests: { game: string; title: string; best: string; rank: number | null }[] | null;
  most_played: { game: string; title: string; runs: number }[];
  favorites: { game: string; title: string }[] | null;
  tournament_wins: number; tournaments_played: number; tournament_points: number;
  me: boolean; settings: Settings | null;
};

const token = () => localStorage.getItem("token");

export const getProfile = (id: number) => call<Profile>(token(), `/players/${id}/profile`);
export const getProfileByUsername = (name: string) => call<Profile>(token(), `/players/by-username/${encodeURIComponent(name)}/profile`);
export const myProfile = () => call<Profile>(token(), "/me/profile");
export const badgeCatalog = () => call<Badge[]>(null, "/badges");
export const saveSettings = (changes: Partial<Settings>) => call<Settings>(token(), "/me/profile-settings", send("PUT", changes));

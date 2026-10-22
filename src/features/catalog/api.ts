// Categories, ratings and filters (PRD T1): API calls (startng-be app/features/catalog).
import { useEffect, useState } from "react";
import { call, send } from "../../api";
import { useFeature } from "../flags";

export type Info = { game: string; category: string | null; rating_count: number; rating_avg: number | null; score: number };
export type Catalog = { categories: string[]; games: Info[] };
export type MyRating = { rating_count: number; rating_avg: number | null; mine: number | null; can_rate: boolean; why_not: string | null };
export type AdminRating = { id: number; game: string; player: string; stars: number; at: string };

const token = () => localStorage.getItem("token");

export const getCatalog = () => call<Catalog>(null, "/catalog");
export const getRating = (game: string) => call<MyRating>(token(), `/games/${encodeURIComponent(game)}/rating`);
export const rate = (game: string, stars: number) => call<MyRating>(token(), `/games/${encodeURIComponent(game)}/rating`, send("PUT", { stars }));
export const unrate = (game: string) => call<MyRating>(token(), `/games/${encodeURIComponent(game)}/rating`, send("DELETE"));
export const setCategory = (game: string, category: string | null) => call<Info>(token(), `/games/${encodeURIComponent(game)}/category`, send("PUT", { category }));
export const adminRatings = (game?: string) => call<AdminRating[]>(token(), `/admin/ratings${game ? `?game=${encodeURIComponent(game)}` : ""}`);
export const removeRating = (id: number) => call<void>(token(), `/admin/ratings/${id}`, send("DELETE"));

let cache: Promise<Catalog> | null = null;

/** Every game's category and rating, fetched once per page load (null until it arrives, or while the feature is off). */
export function useCatalog(): { catalog: Catalog | null; byGame: Map<string, Info> } {
  const on = useFeature("catalog");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    cache ??= getCatalog().catch((e) => { cache = null; throw e; });
    cache.then((c) => live && setCatalog(c)).catch(() => {});
    return () => { live = false; };
  }, [on]);
  return { catalog, byGame: new Map((catalog?.games ?? []).map((i) => [i.game, i])) };
}

/** Forget the fetched catalog (after a rating or category changed), so the next page shows the new totals. */
export const refreshCatalog = () => { cache = null; };

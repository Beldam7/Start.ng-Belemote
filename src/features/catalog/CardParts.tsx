import type { Game } from "../../games";
import Stars from "./Stars";
import { useCatalog } from "./api";

/** The category chip on a game card's picture (a game with none shows nothing). */
export function CategoryChip({ game }: { game: Game }) {
  const { byGame } = useCatalog();
  const category = byGame.get(game.slug)?.category;
  return category ? <span className="tag category-chip">{category}</span> : null;
}

/** The stars under a game card's title, once the game has enough ratings. */
export function CardStars({ game }: { game: Game }) {
  const { byGame } = useCatalog();
  const info = byGame.get(game.slug);
  return info ? <Stars avg={info.rating_avg} count={info.rating_count} /> : null;
}

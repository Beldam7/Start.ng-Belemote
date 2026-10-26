import type { PagePartProps } from "../registry";
import { Picks } from "./Tiles";

/** The /games part (registerPagePart, page "games"): the same few categories above the filters. It goes away while someone searches. */
export default function CategoriesRow({ query }: PagePartProps) {
  if (query) return null;
  return <Picks heading="Browse by category" nested />;
}

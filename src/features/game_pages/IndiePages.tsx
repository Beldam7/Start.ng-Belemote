import type { PagePartProps } from "../registry";
import { getIndieSubPages } from "./api";
import SubPageLinks from "./SubPageLinks";

/** The independent game page part (registerPagePart, page "indie"): links to this game's About and FAQ pages. The game is its id. */
export default function IndiePages({ game }: PagePartProps) {
  return <SubPageLinks id={game} load={getIndieSubPages} />;
}

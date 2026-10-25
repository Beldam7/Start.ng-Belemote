import type { PagePartProps } from "../registry";
import { getSubPages } from "./api";
import SubPageLinks from "./SubPageLinks";

/** The game page part (registerPagePart, page "game"): links to this game's own pages (about, how to play, FAQ, walkthrough). */
export default function GamePages({ game }: PagePartProps) {
  return <SubPageLinks id={game} load={getSubPages} />;
}

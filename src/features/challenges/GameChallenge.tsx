import type { PagePartProps } from "../registry";
import ChallengeButton from "./ChallengeButton";

/** "Challenge a friend" on a game's page: a challenge from your best run, which opens its page to share. */
export default function GameChallenge({ game }: PagePartProps) {
  if (!game || !localStorage.getItem("token")) return null; // the button itself is for signed-in players
  return (
    <div className="game-page-share challenge-make">
      <span>Beat my score</span>
      <ChallengeButton game={game} />
    </div>
  );
}

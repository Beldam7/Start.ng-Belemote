// "Challenge a friend" for a game you've played: makes a challenge from your best run and opens its page, where you
// share it. For a game's page (or the Kit's end-of-round card, which can pass the run instead).
//   import ChallengeButton from "../features/challenges/ChallengeButton";
//   <ChallengeButton game="relic-hunter" />
import { useState } from "react";
import { useFeature } from "../flags";
import { createChallenge } from "./api";

export default function ChallengeButton({ game, runId, className = "ghost" }: { game: string; runId?: number; className?: string }) {
  const on = useFeature("challenges");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!on || !localStorage.getItem("token")) return null;

  async function make() {
    setBusy(true);
    setError("");
    try {
      const c = await createChallenge(runId !== undefined ? { run_id: runId } : { game });
      location.assign(`/c/${c.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={make} disabled={busy}>Challenge a friend</button>
      {error && <p className="error">{error}</p>}
    </>
  );
}

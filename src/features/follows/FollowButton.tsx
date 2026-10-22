import { useEffect, useState } from "react";
import { useFeature } from "../flags";
import { follow, followState, FollowsError, signedIn, unfollow, type FollowState } from "./api";
import "./follows.css";

/** The Follow button (PRD S2, for profiles and creator pages): Follow, Following, or Friends when it's mutual.
 *  Don't show it on the viewer's own page. Hidden while the "follows" flag is off.
 *
 *    import FollowButton from "../follows/FollowButton";
 *    <FollowButton userId={42} name="Ada" onSignIn={onSignIn} showCount />
 */
export default function FollowButton({ userId, name, onSignIn, showCount = false, onChange }: {
  userId: number;
  name?: string; // for the "stop following?" question
  onSignIn?: () => void; // signed-out players are sent here (default: the homepage's sign-in)
  showCount?: boolean; // show "12 followers" next to the button
  onChange?: (state: FollowState) => void;
}) {
  const on = useFeature("follows");
  const [state, setState] = useState<FollowState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!on) return;
    let live = true;
    setState(null);
    setLoadFailed(false);
    followState(userId)
      .then((s) => live && setState(s))
      .catch((e) => { if (live && !(e instanceof FollowsError && e.status === 404)) setLoadFailed(true); }); // no such player: no button
    return () => { live = false; };
  }, [on, userId]);

  if (!on) return null;
  if (loadFailed) return <span className="error">Couldn't load the Follow button. Try again later.</span>;
  if (!state) return null;

  async function toggle() {
    if (!state) return;
    if (!signedIn()) {
      onSignIn ? onSignIn() : location.assign("/?signin");
      return;
    }
    if (state.friends && !confirm(`Stop following ${name ?? "this player"}? You won't be friends any more.`)) return;
    setBusy(true);
    setError("");
    try {
      if (state.you_follow) await unfollow(userId);
      else await follow(userId);
      const next = await followState(userId);
      setState(next);
      onChange?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const label = busy ? "..." : state.friends ? "Friends" : state.you_follow ? "Following" : "Follow";
  return (
    <span className="follow-button">
      <button
        type="button"
        className={state.you_follow ? "ghost" : ""}
        disabled={busy}
        aria-pressed={state.you_follow}
        title={state.you_follow ? "Click to stop following" : undefined}
        onClick={toggle}
      >
        {label}
      </button>
      {showCount && <span className="follow-count">{state.followers} {state.followers === 1 ? "follower" : "followers"}</span>}
      {error && <span className="error">{error}</span>}
    </span>
  );
}

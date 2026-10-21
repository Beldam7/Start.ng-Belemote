import { useEffect, useState } from "react";
import type { ProfileSectionProps } from "../registry";
import FollowButton from "./FollowButton";
import { followState, type FollowState } from "./api";

/** The friends section on a player's profile (the profile page, S1, shows it): counts, and Follow or your own lists. */
export default function ProfileFriends({ userId, isMe }: ProfileSectionProps) {
  const [state, setState] = useState<FollowState | null>(null);
  useEffect(() => {
    let live = true;
    setState(null);
    followState(userId).then((s) => live && setState(s)).catch(() => live && setState(null));
    return () => { live = false; };
  }, [userId]);
  if (!state) return null;
  return (
    <div className="follows-profile">
      <p className="note">{state.followers} {state.followers === 1 ? "follower" : "followers"} - following {state.following}</p>
      {isMe ? <a className="btn ghost" href="/follows">Your friends</a> : <FollowButton userId={userId} onChange={setState} />}
    </div>
  );
}

import { useEffect, useState } from "react";
import type { PageProps } from "../registry";
import { PAGES, setSeo } from "../../seo";
import { AvatarFace } from "../../Avatar";
import { styleFor } from "../../character";
import { acceptInvite, displayName, FollowsError, previewInvite, type InvitePreview } from "./api";
import "./follows.css";

/** start.ng/f/<code>: someone's invite link. Accepting makes you friends (you both follow each other). */
export default function InvitePage({ user, onSignIn, params }: PageProps) {
  const code = params.code;
  const [invite, setInvite] = useState<InvitePreview | null | undefined>(undefined); // null: no such link (or expired)
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSeo(PAGES.friendInvite);
    previewInvite(code)
      .then(setInvite)
      .catch((e) => (e instanceof FollowsError && e.status === 404 ? setInvite(null) : setError("Couldn't load this invite. Try again in a moment.")));
  }, [code]);

  async function accept() {
    if (!user) return onSignIn();
    setBusy(true);
    setError("");
    try {
      await acceptInvite(code);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (invite === undefined && !error) return <section className="container follows-page"><p className="board-sub">Loading...</p></section>;
  if (invite === null) {
    return (
      <section className="container follows-page">
        <p className="empty">This invite link has expired or doesn't exist. Ask your friend for a new one, or <a href="/follows">get your own link</a>.</p>
      </section>
    );
  }
  if (!invite) return <section className="container follows-page"><p className="error">{error}</p></section>;

  const inviter = invite.inviter;
  const name = displayName(inviter);
  const own = user?.id === inviter.id;
  return (
    <section className="container follows-page">
      <div className="follows-invite-card">
        <AvatarFace style={inviter.character?.style ?? styleFor(inviter.id)} size={96} />
        <h1>{done ? `You and ${name} are friends` : `${name} wants to be friends on start.ng`}</h1>
        {own ? (
          <p className="note">This is your own invite link. Send it to a friend: anyone who accepts it becomes your friend.</p>
        ) : done ? (
          <p className="ok">You now follow each other. <a href="/follows">See your friends</a></p>
        ) : (
          <>
            <p className="note">Friends follow each other, so you can see each other on friends' leaderboards and in crews.</p>
            <button type="button" disabled={busy} onClick={accept}>{!user ? "Sign in to accept" : busy ? "..." : "Accept"}</button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </section>
  );
}

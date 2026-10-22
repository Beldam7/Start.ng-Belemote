import { useEffect, useRef, useState } from "react";
import type { PageProps } from "../registry";
import { PAGES, setSeo } from "../../seo";
import FollowButton from "./FollowButton";
import PlayerRow from "./PlayerRow";
import { makeInvite, myPeople, type Invite, type ListKind, type People } from "./api";
import "./follows.css";

const TABS: { kind: ListKind; label: string; empty: string }[] = [
  { kind: "friends", label: "Friends", empty: "No friends yet. Send someone your invite link above." },
  { kind: "following", label: "Following", empty: "You're not following anyone yet." },
  { kind: "followers", label: "Followers", empty: "Nobody follows you yet." },
];

/** start.ng/follows: your invite link, and your friends, who you follow and who follows you. Only you see these lists. */
export default function FollowsPage({ user, onSignIn }: PageProps) {
  const [tab, setTab] = useState<ListKind>("friends");
  const [lists, setLists] = useState<Partial<Record<ListKind, People>>>({});
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const reloadGeneration = useRef(0); // only the newest reload may update the page

  useEffect(() => setSeo(PAGES.follows), []);

  function reload() {
    const generation = ++reloadGeneration.current;
    setError("");
    Promise.all(TABS.map((t) => myPeople(t.kind)))
      .then(([friends, following, followers]) => {
        if (generation === reloadGeneration.current) setLists({ friends, following, followers });
      })
      .catch(() => {
        if (generation === reloadGeneration.current) setError("Couldn't load your lists. Try again in a moment.");
      });
  }
  // A different account must never see the last account's private lists, even for a moment.
  useEffect(() => {
    reloadGeneration.current++;
    setLists({});
    if (user) reload();
  }, [user?.id]);

  if (!user) {
    return (
      <section className="container follows-page">
        <h1>Friends</h1>
        <p className="empty">Sign in to see your friends and invite new ones. <button type="button" className="link" onClick={onSignIn}>Sign in</button></p>
      </section>
    );
  }

  const link = invite ? `${location.origin}${invite.path}` : "";
  const canShare = typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches; // phones and tablets
  const text = "Be my friend on start.ng, so we can see each other's games and scores:";

  async function getLink() {
    setBusy(true);
    setError("");
    try {
      setInvite(await makeInvite());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* the link is on the page to copy by hand */ }
  }
  async function share() {
    try {
      await navigator.share({ title: "start.ng", text, url: link });
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") copy();
    }
  }

  const current = lists[tab];
  const shown = TABS.find((t) => t.kind === tab)!;
  return (
    <section className="container follows-page">
      <h1>Friends</h1>

      <div className="follows-invite">
        <div>
          <h2>Invite a friend</h2>
          <p className="note">Anyone who opens your link and accepts becomes your friend. It works for 7 days and you can send it to as many people as you like.</p>
        </div>
        {!invite ? (
          <button type="button" disabled={busy} onClick={getLink}>{busy ? "..." : "Get my invite link"}</button>
        ) : (
          <div className="follows-link">
            <code>{link}</code>
            <div className="private-share">
              {canShare && <button type="button" onClick={share}>Share the link</button>}
              <a className={canShare ? "btn ghost" : "btn"} href={`https://wa.me/?${new URLSearchParams({ text: `${text} ${link}` })}`} target="_blank" rel="noreferrer">Invite on WhatsApp</a>
              <button type="button" className="ghost" onClick={copy}>{copied ? "Link copied" : "Copy link"}</button>
            </div>
          </div>
        )}
      </div>

      <div className="follows-tabs" role="group" aria-label="Your lists">
        {TABS.map((t) => (
          <button key={t.kind} type="button" aria-pressed={tab === t.kind} className={tab === t.kind ? "on" : ""} onClick={() => setTab(t.kind)}>
            {t.label}{lists[t.kind] ? ` (${lists[t.kind]!.count})` : ""}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!current && !error && <p className="board-sub">Loading...</p>}
      {current && current.count === 0 && <p className="empty">{shown.empty}</p>}
      {current && current.count > 0 && (
        <ul className="follows-list">
          {current.people.map((p) => (
            <PlayerRow key={p.id} player={p}>
              <FollowButton userId={p.id} name={p.character?.name ?? p.name ?? undefined} onSignIn={onSignIn} onChange={reload} />
            </PlayerRow>
          ))}
        </ul>
      )}
      <p className="note follows-private">Only you can see these lists. Other players only see how many followers you have.</p>
    </section>
  );
}

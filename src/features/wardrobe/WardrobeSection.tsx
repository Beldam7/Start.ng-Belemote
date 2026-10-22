import { useEffect, useState } from "react";
import type { ProfileSectionProps } from "../registry";
import { getItems, getPlayerWardrobe, type Item, type PublicWardrobe } from "./api";
import ItemTile from "./ItemTile";
import "./wardrobe.css";
import { SLOT_NAMES } from "./words";

/** A player's worn items and their three rarest, on their profile (S1). Hidden with the rest of a private page. */
export default function WardrobeSection({ userId, isMe }: ProfileSectionProps) {
  const [data, setData] = useState<{ w: PublicWardrobe; items: Map<string, Item> } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    Promise.all([getPlayerWardrobe(userId), getItems()])
      .then(([w, items]) => setData({ w, items: new Map(items.map((i) => [i.key, i])) }))
      .catch(() => setError(true));
  }, [userId]);

  if (error) return null;
  if (!data) return <p className="board-sub">Loading…</p>;
  const { w, items } = data;
  if (w.items_owned === 0) return <p className="note">{isMe ? <>No items yet. <a href="/shop">Visit the shop</a> or play to earn some.</> : "No items yet."}</p>;
  const worn = Object.entries(w.worn).map(([slot, key]) => `${SLOT_NAMES[slot as keyof typeof SLOT_NAMES]}: ${items.get(key!)?.name ?? key}`);
  return (
    <div className="wd-section">
      <p className="note">{w.items_owned} {w.items_owned === 1 ? "item" : "items"}{worn.length ? ` · Wearing ${worn.join(", ")}` : ""}</p>
      <ul className="wd-grid compact">
        {w.showcase.map((k) => items.get(k)).filter((i): i is Item => !!i).map((i) => <ItemTile key={i.key} item={i} />)}
      </ul>
      {isMe && <a href="/wardrobe">Your wardrobe →</a>}
    </div>
  );
}

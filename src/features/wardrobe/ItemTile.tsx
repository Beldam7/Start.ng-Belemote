import type { ReactNode } from "react";
import type { Item } from "./api";
import ItemPic from "./ItemPic";
import { share } from "./words";

/** One item: its picture with a rarity glow, its name and rarity, and whatever the page adds below (a price, Wear).
 *  mine: the viewer owns it, so an item nobody else has yet reads as a first. */
export default function ItemTile({ item, locked = false, on = false, mine = false, children }: { item: Item; locked?: boolean; on?: boolean; mine?: boolean; children?: ReactNode }) {
  return (
    <li className={`wd-item r-${item.rarity}${locked ? " locked" : ""}${on ? " on" : ""}`}>
      <span className="wd-pic" aria-hidden="true"><ItemPic itemKey={item.key} slot={item.slot} />{locked && <span className="wd-lock">🔒</span>}</span>
      <strong>{item.name}</strong>
      <span className={`wd-rarity r-${item.rarity}`}>{item.rarity}</span>
      <span className="wd-how">{locked ? item.how : mine && item.owned_share === 0 ? "One of the first to own it" : share(item.owned_share)}</span>
      {children}
    </li>
  );
}

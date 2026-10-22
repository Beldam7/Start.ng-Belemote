import { useEffect, useState } from "react";
import type { Slot } from "./api";
import { picture } from "./words";

/** The item as it looks worn (a small 3D picture, made once per item and kept). The emoji shows until it's ready, or
 *  if this browser can't draw 3D. */
export default function ItemPic({ itemKey, slot }: { itemKey: string; slot: Slot }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const run = () => import("../../three/snapshot").then((m) => { if (live) setSrc(m.itemImage(itemKey, slot)); }).catch(() => {});
    const id = window.setTimeout(run, 30);
    return () => { live = false; window.clearTimeout(id); };
  }, [itemKey, slot]);
  return src ? <img src={src} alt="" decoding="async" /> : <span className="wd-emoji">{picture(itemKey, slot)}</span>;
}

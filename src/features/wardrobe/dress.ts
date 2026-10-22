// Putting worn items on a character for the 3D previews (three/items.ts draws them).
import { useEffect, useState } from "react";
import type { CharacterStyle, DressedStyle } from "../../character";
import { getWardrobe, type Slot } from "./api";

export type Worn = { key: string; slot: Slot }[];

/** The style with these items on: a hat or extra replaces the character's own, and every item goes in `items`.
 *  The same shape the API gives games (style_overrides). */
export function dressed(base: CharacterStyle, worn: Worn): DressedStyle {
  const out: DressedStyle = { ...base, items: worn };
  for (const { key, slot } of worn) {
    if (slot === "hat") out.hat = key;
    if (slot === "accessory") out.accessory = key;
  }
  return out;
}

/** The same items with one more on (trying something on replaces what's in its slot). */
export const withItem = (worn: Worn, key: string, slot: Slot): Worn => [...worn.filter((w) => w.slot !== slot), { key, slot }];

/** What the signed-in player wears, kept up to date after wearing or buying. null until loaded (or when off). */
export function useWorn(on: boolean): Worn | null {
  const [worn, setWorn] = useState<Worn | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    const load = () => getWardrobe()
      .then((w) => live && setWorn(Object.entries(w.worn).map(([slot, key]) => ({ key: key!, slot: slot as Slot }))))
      .catch(() => {});
    load();
    window.addEventListener("wardrobe:changed", load);
    return () => { live = false; window.removeEventListener("wardrobe:changed", load); };
  }, [on]);
  return worn;
}

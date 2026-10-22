import { useEffect, useState } from "react";
import { changed, getItems, getWardrobe, takeOff, wear, type Item, type Slot, type Wardrobe } from "./api";
import ItemTile from "./ItemTile";
import "./wardrobe.css";
import { RARITIES, SLOT_NAMES, SLOTS } from "./words";

/** Your items: what you wear in each slot, everything you own (Wear / Take off), and every locked item greyed out
 *  with how to get it, so there's always a next goal. Used by /wardrobe and the Wardrobe tab of the profile. */
export default function WardrobePanel({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [mine, setMine] = useState<Wardrobe | null>(null);
  const [slot, setSlot] = useState<Slot | "all">("all");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const load = () => Promise.all([getItems(), getWardrobe()])
      .then(([i, w]) => { if (live) { setItems(i); setMine(w); } })
      .catch(() => live && setError("Couldn't load your wardrobe. Try again in a moment."));
    load();
    // Wearing something from the unlock popup, or buying in another tab, changes what's shown here.
    window.addEventListener("wardrobe:changed", load);
    return () => { live = false; window.removeEventListener("wardrobe:changed", load); };
  }, []);

  async function act(key: string, run: () => Promise<Wardrobe>) {
    setBusy(key);
    setError("");
    try {
      setMine(await run());
      changed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  if (error && !items) return <p className="error">{error}</p>;
  if (!items || !mine) return <p className="board-sub">Loading…</p>;

  const owned = new Set(mine.owned.map((o) => o.key));
  const shown = items.filter((i) => slot === "all" || i.slot === slot);
  const have = shown.filter((i) => owned.has(i.key));
  // Locked: the rarest first, so the big goals are at the top.
  const locked = shown.filter((i) => !owned.has(i.key)).sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity));
  const byKey = new Map(items.map((i) => [i.key, i]));

  return (
    <div className={`wd-panel${compact ? " compact" : ""}`}>
      <div className="wd-worn" aria-label="What you're wearing">
        {SLOTS.map((s) => {
          const item = mine.worn[s] ? byKey.get(mine.worn[s]!) : undefined;
          return (
            <div key={s} className={`wd-slot${item ? ` r-${item.rarity}` : ""}`}>
              <span className="note">{SLOT_NAMES[s]}</span>
              <b>{item?.name ?? "Nothing"}</b>
              {item && <button type="button" className="link" disabled={busy !== ""} onClick={() => act(s, () => takeOff(s))}>Take off</button>}
            </div>
          );
        })}
      </div>

      <div className="chips wd-filter" role="group" aria-label="Slot">
        {(["all", ...SLOTS] as const).map((s) => (
          <button key={s} type="button" className={slot === s ? "on" : ""} aria-pressed={slot === s} onClick={() => setSlot(s)}>
            {s === "all" ? "All" : SLOT_NAMES[s]}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}

      <h3 className="wd-heading">Yours <span className="note">{owned.size} of {items.length}</span></h3>
      {have.length === 0 ? (
        <p className="note">Nothing here yet. Play games to earn coins and items, or visit the <a href="/shop">shop</a>.</p>
      ) : (
        <ul className="wd-grid">
          {have.map((i) => {
            const on = mine.worn[i.slot] === i.key;
            return (
              <ItemTile key={i.key} item={i} on={on} mine>
                {on ? (
                  <button type="button" className="ghost" disabled={busy !== ""} onClick={() => act(i.key, () => takeOff(i.slot))}>Take off</button>
                ) : (
                  <button type="button" disabled={busy !== ""} onClick={() => act(i.key, () => wear(i.key))}>{busy === i.key ? "…" : "Wear"}</button>
                )}
              </ItemTile>
            );
          })}
        </ul>
      )}

      {locked.length > 0 && (
        <>
          <h3 className="wd-heading">Still to get</h3>
          <ul className="wd-grid">
            {locked.map((i) => (
              <ItemTile key={i.key} item={i} locked>
                {i.price !== null && <a className="wd-buy-link" href="/shop">In the shop today</a>}
              </ItemTile>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

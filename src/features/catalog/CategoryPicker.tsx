import { useState } from "react";
import type { YourGameProps } from "../registry";
import { refreshCatalog, setCategory, useCatalog } from "./api";

/** In Your games: pick the game's category. A category in the game's startng.json replaces this on the next publish. */
export default function CategoryPicker({ game }: YourGameProps) {
  const { catalog, byGame } = useCatalog();
  const [value, setValue] = useState<string | null | undefined>(undefined);
  const [note, setNote] = useState("");
  if (!catalog) return null;
  const current = value === undefined ? byGame.get(game.name)?.category ?? "" : value ?? "";

  async function change(next: string) {
    setNote("");
    try {
      const saved = await setCategory(game.name, next || null);
      setValue(saved.category);
      refreshCatalog();
      setNote("Saved. A category in startng.json wins when you publish.");
    } catch (e) { setNote(e instanceof Error ? e.message : "Couldn't save that"); }
  }

  return (
    <div className="category-picker">
      <label>
        Category{" "}
        <select value={current} onChange={(e) => change(e.target.value)}>
          <option value="">Uncategorized</option>
          {catalog.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      {note && <span className="note" role="status">{note}</span>}
    </div>
  );
}

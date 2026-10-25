import { useEffect, useState } from "react";
import { getChoices, type ChoiceGroup } from "./api";

export const MAX_PICKED = 5;

/** The categories field of the "Submit your game" form (src/Creators.tsx). It shows nothing while the tags feature is off. */
export default function IndieCategoryPicker({ picked, other, onPick, onOther }: {
  picked: string[]; other: string; onPick: (slugs: string[]) => void; onOther: (text: string) => void;
}) {
  const [groups, setGroups] = useState<ChoiceGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { getChoices().then(setGroups).catch(() => setFailed(true)); }, []);
  if (failed || !groups) return null; // off, or not loaded: the game can still be added without categories
  const toggle = (slug: string) => onPick(picked.includes(slug) ? picked.filter((s) => s !== slug) : picked.length < MAX_PICKED ? [...picked, slug] : picked);
  return (
    <fieldset className="indie-categories">
      <legend>Categories <em>{picked.length}/{MAX_PICKED}</em></legend>
      <p className="note">Pick up to {MAX_PICKED} that fit your game. They show on your game's page.</p>
      {groups.map((g) => (
        <div key={g.name} className="indie-categories-group">
          <p className="eyebrow">{g.name}</p>
          <div className="chips" role="group" aria-label={g.name}>
            {g.tags.map((t) => (
              <button key={t.slug} type="button" className={picked.includes(t.slug) ? "on" : ""} aria-pressed={picked.includes(t.slug)}
                disabled={!picked.includes(t.slug) && picked.length >= MAX_PICKED} onClick={() => toggle(t.slug)}>{t.label}</button>
            ))}
          </div>
        </div>
      ))}
      <label className="indie-categories-other">
        <span>Other <em>{other.length}/40</em></span>
        <input value={other} onChange={(e) => onOther(e.target.value)} maxLength={40} placeholder="None of these fit? Write your own" />
      </label>
    </fieldset>
  );
}

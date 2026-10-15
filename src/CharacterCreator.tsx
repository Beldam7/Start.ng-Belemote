import { FormEvent, useState } from "react";
import { AvatarBody } from "./Avatar";
import { ACCESSORIES, BOTTOMS, Character, CharacterStyle, HAIR_COLORS, HAIRS, HATS, SKINS, TOPS } from "./character";

type Props = {
  initial: Character;
  editing: boolean;
  email: string;
  onSave: (c: Character) => Promise<void>;
  onCancel: () => void;
};

const label = (v: string) => (v === "tophat" ? "top hat" : v);

export default function CharacterCreator({ initial, editing, email, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const [style, setStyle] = useState<CharacterStyle>(initial.style);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof CharacterStyle>(k: K, v: CharacterStyle[K]) => setStyle((s) => ({ ...s, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), style });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your character");
      setSaving(false);
    }
  }

  const swatches = (key: "skinColor" | "hairColor" | "primaryColor" | "secondaryColor", list: string[]) => (
    <div className="swatches">
      {list.map((c) => (
        <button type="button" key={c} className={style[key] === c ? "on" : ""} style={{ background: c }} aria-label={c} onClick={() => set(key, c)} />
      ))}
    </div>
  );
  const chips = <K extends "hair" | "hat" | "accessory">(key: K, list: CharacterStyle[K][]) => (
    <div className="chips">
      {list.map((v) => (
        <button type="button" key={v} className={style[key] === v ? "on" : ""} onClick={() => set(key, v)}>{label(v)}</button>
      ))}
    </div>
  );

  return (
    <div className="overlay creator-overlay">
      <form className="creator" onSubmit={submit}>
        <div className="creator-preview">
          <AvatarBody style={style} />
          <strong>{name.trim() || "Your character"}</strong>
        </div>
        <div className="creator-controls">
          <p className="eyebrow">{editing ? "Profile" : "Welcome to start.ng"}</p>
          <h2>{editing ? "Your profile" : "Create your character"}</h2>
          <p className="lead-sm">{editing ? <>Signed in as {email}. Your character is you in every game.</> : "This is you in every game on start.ng."}</p>

          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" maxLength={24} required />
          </label>
          <div className="field"><span>Skin</span>{swatches("skinColor", SKINS)}</div>
          <div className="field"><span>Hair</span>{chips("hair", HAIRS)}</div>
          {style.hair !== "bald" && <div className="field"><span>Hair colour</span>{swatches("hairColor", HAIR_COLORS)}</div>}
          <div className="field"><span>Top</span>{swatches("primaryColor", TOPS)}</div>
          <div className="field"><span>Bottoms</span>{swatches("secondaryColor", BOTTOMS)}</div>
          <div className="field"><span>Hat</span>{chips("hat", HATS)}</div>
          <div className="field"><span>Extra</span>{chips("accessory", ACCESSORIES)}</div>

          {error && <p className="error">{error}</p>}
          <div className="creator-actions">
            <button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Done"}</button>
            {editing && <button type="button" className="ghost" onClick={onCancel}>Cancel</button>}
          </div>
        </div>
      </form>
    </div>
  );
}

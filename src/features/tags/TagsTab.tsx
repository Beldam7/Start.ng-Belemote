import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminTabProps } from "../registry";
import { adminReview, adminSetTags, adminSuggest, adminTags, type ReviewRow, type Tag } from "./api";

// start.ng/admin#tags: the tag rules suggest tags for every game; they are approved automatically, except tags about a place or a people (Nigerian, African, Lagos), which wait here.
// Nothing is shown to players until it is approved. A tag only gets a public page once 3 games have it.

function Row({ row, tags, tagsLoading, onSaved }: { row: ReviewRow; tags: Tag[]; tagsLoading: boolean; onSaved: () => void }) {
  const label = useMemo(() => new Map(tags.map((t) => [t.slug, t.label])), [tags]);
  const [picked, setPicked] = useState<string[]>(() => [...new Set([...row.approved, ...row.suggested])]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Nothing can change while a save is on its way: it sends the list as it was when Save was pressed.
  const toggle = (s: string) => { if (!saving) setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s])); };
  const addable = tags.filter((t) => !picked.includes(t.slug) && !t.group.startsWith("Words people"));
  const waiting = (s: string) => row.suggested.includes(s) && !row.approved.includes(s); // suggested by the rules, not approved yet

  async function save() {
    setSaving(true);
    setError("");
    try { await adminSetTags(row.game, picked); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save"); } finally { setSaving(false); }
  }

  return (
    <article className="admin-item">
      <div className="admin-item-head">
        <div className="admin-item-title">
          <h3>{row.game}</h3>
          <p className="note">{row.suggested.length > 0 ? `${row.suggested.length} suggested` : "No suggestions"}{row.approved.length > 0 ? ` · ${row.approved.length} approved` : ""}</p>
        </div>
        <button type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </div>
      <div className="chips tags-admin-chips" role="group" aria-label={`Tags for ${row.game}`}>
        {picked.map((s) => (
          <button key={s} type="button" className={waiting(s) ? "on suggested" : "on"} aria-pressed="true" disabled={saving} onClick={() => toggle(s)}
            title={waiting(s) ? "Suggested by the rules, not approved until you save. Tap to remove" : "Approved. Tap to remove"}>
            {label.get(s) ?? s}{waiting(s) ? " · suggested" : ""} ✕
          </button>
        ))}
        <select value="" disabled={saving || tagsLoading || tags.length === 0} onChange={(e) => e.target.value && toggle(e.target.value)} aria-label={`Add a tag to ${row.game}`}>
          <option value="">+ Add a tag</option>
          {addable.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
        </select>
      </div>
      {row.requested && row.requested.length > 0 && <p className="note">The creator wrote their own category: {row.requested.map((r) => `"${r}"`).join(", ")}. If many games ask for the same, add it to the list.</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </article>
  );
}

export default function TagsTab({ ask }: AdminTabProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState("");
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(true);
  const [note, setNote] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(0); // each reload gets a number; only the newest one may change what is shown

  const reload = useCallback(() => {
    const mine = ++latest.current;
    setError("");
    setLoading(true);
    adminReview(pending)
      .then((r) => { if (mine === latest.current) setRows(r); })
      .catch((e) => { if (mine === latest.current) setError(e instanceof Error ? e.message : "Couldn't load the games"); })
      .finally(() => { if (mine === latest.current) setLoading(false); });
  }, [pending]);
  const loadTags = useCallback(() => {
    setTagsLoading(true);
    setTagsError("");
    adminTags().then(setTags).catch((e) => setTagsError(e instanceof Error ? e.message : "Couldn't load the tags")).finally(() => setTagsLoading(false));
  }, []);
  useEffect(loadTags, [loadTags]);
  useEffect(reload, [reload]);

  async function suggest() {
    if (suggesting) return;
    setSuggesting(true);
    try {
      const ok = await ask({ title: "Suggest tags for every game?", body: "The rules look at each game's name and description and add suggestions. Safe ones are approved by themselves.", confirm: "Suggest" });
      if (ok === null) return;
      const r = await adminSuggest();
      setNote(`${r.added} suggestions added.`);
      reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't suggest"); } finally { setSuggesting(false); }
  }

  return (
    <section>
      <div className="dup-head">
        <div>
          <h2>Tags</h2>
          <p className="note">Tags are suggested and approved automatically. Check or change them here: tap a tag to take it off, or add one. A tag gets its own page once 3 games have it. "Web games" and the other search words are on every game already.</p>
        </div>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => { setRows(null); setPending((p) => !p); }}>{pending ? "Show all games" : "Show only games to review"}</button>
          <button type="button" onClick={suggest} disabled={suggesting}>{suggesting ? "Suggesting…" : "Suggest tags"}</button>
        </div>
      </div>
      {note && <p className="note" role="status">{note}</p>}
      {error && <p className="error" role="alert">{error} <button type="button" className="link" onClick={reload}>Try again</button></p>}
      {tagsError && <p className="error" role="alert">{tagsError} <button type="button" className="link" onClick={loadTags}>Try again</button></p>}
      {loading && <p className="tags-state" role="status">Loading games…</p>}
      {tagsLoading && !loading && <p className="tags-state" role="status">Loading the tag choices…</p>}
      {rows && rows.length === 0 && <p className="empty">{pending ? "Nothing to review. Run Suggest tags to look for new suggestions." : "No games."}</p>}
      <div className="admin-list">
        {rows?.map((r) => <Row key={r.game + r.approved.join() + r.suggested.join()} row={r} tags={tags} tagsLoading={tagsLoading} onSaved={reload} />)}
      </div>
    </section>
  );
}

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AdminTabProps } from "../registry";
import { deleteLetter, newsletters, saveLetter, sendLetter, testLetter, type Letter, type Newsletters } from "./api";

// start.ng/admin#newsletter: write a newsletter, send yourself a test, then send it to everyone on the newsletter topic.

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");
const daysAgo = (iso: string) => Math.floor((Date.now() - new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? iso : `${iso}Z`).getTime()) / 86400000);

export default function NewsletterTab(_: AdminTabProps) {
  const [data, setData] = useState<Newsletters | null>(null);
  const [editing, setEditing] = useState<number | null>(null); // the draft being edited, or null for a new one
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => newsletters().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { reload(); }, [reload]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "That didn't work");
  const clear = () => { setError(""); setNote(""); };
  const reset = () => { setEditing(null); setSubject(""); setBody(""); setPreview(""); };

  async function save(e: FormEvent) {
    e.preventDefault();
    clear();
    setBusy(true);
    try {
      const saved = await saveLetter(subject, body, editing ?? undefined);
      setEditing(saved.id);
      setPreview(saved.preview_html);
      setNote("Saved as a draft.");
      await reload();
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function test(id: number) {
    clear();
    setBusy(true);
    try { setNote(`Test sent to ${(await testLetter(id)).to}. Check that inbox (and spam).`); } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function sendNow(letter: Letter) {
    clear();
    if (!window.confirm(`Send "${letter.subject}" to ${data?.audience ?? 0} subscribers? This can't be undone.`)) return;
    setBusy(true);
    try {
      let done: Letter;
      try {
        done = await sendLetter(letter.id);
      } catch (err) {
        // The API says when the last newsletter was too recent; the admin decides.
        if (err instanceof Error && err.message.includes("Send anyway") && window.confirm(err.message)) done = await sendLetter(letter.id, true);
        else throw err;
      }
      setNote(`Sent to ${done.recipients} subscribers.`);
      if (editing === letter.id) reset();
      await reload();
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function remove(letter: Letter) {
    if (!window.confirm(`Delete the draft "${letter.subject}"?`)) return;
    clear();
    try { await deleteLetter(letter.id); if (editing === letter.id) reset(); await reload(); } catch (err) { fail(err); }
  }

  function edit(letter: Letter) {
    clear();
    setEditing(letter.id);
    setSubject(letter.subject);
    setBody(letter.body);
    setPreview(letter.preview_html);
  }

  const recent = data?.last_sent_at ? daysAgo(data.last_sent_at) : null;
  const tooSoon = data !== null && recent !== null && recent < data.every_days;
  const drafts = data?.letters.filter((l) => !l.sent_at) ?? [];
  const sent = data?.letters.filter((l) => l.sent_at) ?? [];

  return (
    <section>
      <div className="dup-head">
        <div>
          <h2>Newsletter</h2>
          <p className="note">{data ? `A newsletter reaches ${data.audience} confirmed subscribers.` : ""}</p>
        </div>
      </div>
      {tooSoon && data && (
        <p className="warn" role="status">
          The last newsletter went out {recent === 0 ? "today" : `${recent} day${recent === 1 ? "" : "s"} ago`} ({when(data.last_sent_at)}).
          Subscribers were promised at most one every {data.every_days} days, so wait if you can.
        </p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {note && <p className="ok" role="status">{note}</p>}

      <form className="newsletter-form" onSubmit={save}>
        <label>
          Subject
          <input value={subject} maxLength={150} required onChange={(e) => setSubject(e.target.value)} placeholder="What's new on start.ng" />
        </label>
        <label>
          Message
          <textarea value={body} rows={12} maxLength={20000} required onChange={(e) => setBody(e.target.value)}
            placeholder={"# A heading\n\nA paragraph. A blank line starts the next one.\n\nPlay today: [start.ng/tournament](https://start.ng/tournament)"} />
        </label>
        <p className="note">Plain text. A line starting with "# " is a heading, a blank line starts a new paragraph, and [words](https://link) makes a link.</p>
        <div className="newsletter-actions">
          <button type="submit" disabled={busy}>{editing ? "Save changes" : "Save draft"}</button>
          {editing !== null && <button type="button" className="ghost" disabled={busy} onClick={() => test(editing)}>Send me a test</button>}
          {editing !== null && <button type="button" className="ghost" disabled={busy} onClick={reset}>New newsletter</button>}
        </div>
      </form>

      {preview && (
        <div className="newsletter-preview">
          <p className="note">Preview (the email adds the start.ng header and the unsubscribe links)</p>
          {/* Built by the API from the text above with everything escaped except its own paragraphs and links. */}
          <div dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
      )}

      <h3>Drafts</h3>
      {drafts.length === 0 && <p className="empty">No drafts.</p>}
      <div className="admin-list">
        {drafts.map((l) => (
          <article key={l.id} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3>{l.subject}</h3>
                <p className="note">by {l.created_by} · {when(l.updated_at)}</p>
              </div>
              <div className="newsletter-actions">
                <button type="button" className="ghost" disabled={busy} onClick={() => edit(l)}>Edit</button>
                <button type="button" disabled={busy} onClick={() => sendNow(l)}>Send</button>
                <button type="button" className="ghost" disabled={busy} onClick={() => remove(l)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <h3>Sent</h3>
      {sent.length === 0 && <p className="empty">Nothing sent yet.</p>}
      <div className="admin-list">
        {sent.map((l) => (
          <article key={l.id} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3>{l.subject}</h3>
                <p className="note">{when(l.sent_at)} · {l.recipients} recipients · sent by {l.sent_by}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

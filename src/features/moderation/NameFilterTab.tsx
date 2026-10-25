import { useCallback, useEffect, useState } from "react";
import type { AdminTabProps } from "../registry";
import { addWord, flaggedNames, listWords, removeWord, tryText, type Flagged, type Word } from "./api";

// start.ng/admin#name-filter: the words the name filter blocks or allows, a box to try a name, and names already on
// start.ng that fail. The filter checks game names, startng.json descriptions, character names and Creators listings.

const KIND_LABEL: Record<Flagged["kind"], string> = {
  game: "Game name",
  game_description: "Game description",
  character: "Character name",
  creators_listing: "Creators listing",
};

export default function NameFilterTab({ ask }: AdminTabProps) {
  const [words, setWords] = useState<Word[] | null>(null);
  const [flagged, setFlagged] = useState<Flagged[] | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ ok: boolean; word: string | null } | null>(null);
  const [word, setWord] = useState("");
  const [kind, setKind] = useState<"block" | "allow">("block");
  const [strong, setStrong] = useState(false);

  const reload = useCallback(() => {
    setError("");
    listWords().then(setWords).catch((e) => setError(e.message));
    flaggedNames().then(setFlagged).catch((e) => setError(e.message));
  }, []);
  useEffect(reload, [reload]);

  async function act(fn: () => Promise<unknown>) {
    setError("");
    try { await fn(); reload(); } catch (e) { setError(e instanceof Error ? e.message : "That didn't work"); }
  }

  const own = words?.filter((w) => !w.built_in) ?? [];
  const builtIn = words?.filter((w) => w.built_in) ?? [];

  return (
    <section className="name-filter">
      <h2>Name filter</h2>
      <p className="note">
        Keeps offensive words out of game names, startng.json descriptions, character names and Creators listings. Look-alike
        spellings (sh1t, $hit, s.h.i.t) are caught too. Names that are already live aren't changed: they're listed below.
      </p>
      {error && <p className="error" role="alert">{error}</p>}

      <h3>Try a name</h3>
      <form className="admin-inline" onSubmit={(e) => { e.preventDefault(); tryText(text).then(setResult).catch((err) => setError(err.message)); }}>
        <input id="filter-try" value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} placeholder="e.g. Lane Dash" maxLength={300} />
        <button type="submit" disabled={!text.trim()}>Check</button>
      </form>
      {result && (
        <p className={result.ok ? "filter-result ok" : "filter-result bad"} role="status">
          {result.ok ? "Allowed." : <>Blocked because of <b>{result.word}</b>.</>}
        </p>
      )}

      <h3>Add a word</h3>
      <form className="filter-add" onSubmit={(e) => { e.preventDefault(); act(() => addWord(word.trim(), kind, strong)).then(() => setWord("")); }}>
        <div className="filter-add-row">
          <input id="filter-word" value={word} onChange={(e) => setWord(e.target.value)} placeholder="One word" maxLength={40} required />
          <div className="segmented" role="group" aria-label="Block or allow">
            <button type="button" className={kind === "block" ? "on" : ""} aria-pressed={kind === "block"} onClick={() => setKind("block")}>Block it</button>
            <button type="button" className={kind === "allow" ? "on" : ""} aria-pressed={kind === "allow"} onClick={() => setKind("allow")}>Allow it</button>
          </div>
          <button type="submit" disabled={!word.trim()}>Add</button>
        </div>
        {kind === "block" && (
          <label className="filter-strong">
            <input type="checkbox" checked={strong} onChange={(e) => setStrong(e.target.checked)} />
            Also block it inside other words
          </label>
        )}
      </form>
      <p className="note">
        "Allow" overrides the built-in list for a word that's fine here. Only tick "also inside other words" for words that never
        sit inside a normal one ("rapist" would block "therapist").
      </p>

      <h3>Added by admins</h3>
      {words && own.length === 0 && <p className="empty">None yet. The built-in lists below are in use.</p>}
      {own.length > 0 && (
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Word</th><th>List</th><th>Added by</th><th /></tr></thead>
          <tbody>
            {own.map((w) => (
              <tr key={w.id}>
                <td>{w.word}</td>
                <td>{w.kind === "allow" ? "Allowed" : w.strong ? "Blocked, also inside words" : "Blocked"}</td>
                <td>{w.added_by}</td>
                <td><button type="button" className="link" onClick={async () => {
                  if (await ask({ title: `Remove "${w.word}"?`, body: <>The name filter stops using it straight away.</>, confirm: "Remove" }) !== null) act(() => removeWord(w.id!));
                }}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      <h3>Already on start.ng</h3>
      {flagged && flagged.length === 0 && <p className="empty">Every live name passes the filter.</p>}
      {flagged && flagged.length > 0 && (
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>What</th><th>Name</th><th>Caught</th><th>Owner</th></tr></thead>
          <tbody>
            {flagged.map((f) => (
              <tr key={`${f.kind}-${f.target}`}>
                <td>{KIND_LABEL[f.kind]}</td>
                <td>{f.kind === "game" || f.kind === "game_description" ? <a href={`/games/${f.target}`} target="_blank" rel="noreferrer">{f.name}</a> : f.name}</td>
                <td>{f.word}</td>
                <td>{f.owner}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <p className="note">To deal with a game, flag it from its page or the Reports tab. Tell its owner what to rename.</p>

      <details className="filter-builtin">
        <summary>Built-in lists ({builtIn.length} words)</summary>
        <p className="note">Blocked inside other words: {builtIn.filter((w) => w.kind === "block" && w.strong).map((w) => w.word).join(", ")}</p>
        <p className="note">Blocked as whole words: {builtIn.filter((w) => w.kind === "block" && !w.strong).map((w) => w.word).join(", ")}</p>
        <p className="note">Allowed: {builtIn.filter((w) => w.kind === "allow").map((w) => w.word).join(", ")}</p>
      </details>
    </section>
  );
}

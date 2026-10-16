// A small Markdown renderer for the docs page (start.ng/docs.md): headings, paragraphs, lists,
// quotes, tables, fenced code, and inline code, bold and links. It builds React elements, never
// HTML strings, so nothing in the file can inject markup.
import { Fragment, ReactNode } from "react";

export const slug = (text: string) => text.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${m.index}`;
    if (m[1] !== undefined) out.push(<code key={k}>{m[1]}</code>);
    else if (m[2] !== undefined) out.push(<b key={k}>{inline(m[2], m.index)}</b>);
    else {
      const href = m[4];
      const external = /^https?:/.test(href);
      out.push(
        <a key={k} href={/^(https?:|\/|#)/.test(href) ? href : "#"} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {inline(m[3], m.index)}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const k = blocks.length;
    if (!line.trim()) {
      i++;
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].startsWith("```"); i++) code.push(lines[i]);
      i++;
      blocks.push(
        <pre key={k} data-lang={lang || undefined}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
    } else if (/^#{1,4} /.test(line)) {
      const level = line.match(/^#+/)![0].length;
      const text = line.slice(level + 1);
      const H = `h${level}` as "h1";
      blocks.push(<H key={k} id={slug(text)}>{inline(text)}</H>);
      i++;
    } else if (line.trimStart().startsWith("|") && lines[i + 1]?.includes("---")) {
      const head = cells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trimStart().startsWith("|"); i++) rows.push(cells(lines[i]));
      blocks.push(
        <div key={k} className="table">
          <table>
            <thead>
              <tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (/^\s*([-*]|\d+\.) /.test(line)) {
      const ordered = /^\s*\d+\. /.test(line);
      const items: string[] = [];
      for (; i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i]); i++) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.) /, "");
        while (i + 1 < lines.length && /^ {2,}\S/.test(lines[i + 1]) && !/^\s*([-*]|\d+\.) /.test(lines[i + 1])) item += " " + lines[++i].trim();
        items.push(item);
      }
      const L = ordered ? "ol" : "ul";
      blocks.push(<L key={k}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</L>);
    } else if (line.startsWith(">")) {
      const quote: string[] = [];
      for (; i < lines.length && lines[i].startsWith(">"); i++) quote.push(lines[i].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={k}>{quote.map((q, j) => <Fragment key={j}>{inline(q)}{j < quote.length - 1 && <br />}</Fragment>)}</blockquote>);
    } else {
      const para: string[] = [];
      for (; i < lines.length && lines[i].trim() && !/^(#{1,4} |```|>|\s*([-*]|\d+\.) |\s*\|)/.test(lines[i]); i++) para.push(lines[i].trim());
      blocks.push(<p key={k}>{inline(para.join(" "))}</p>);
    }
  }
  return <>{blocks}</>;
}

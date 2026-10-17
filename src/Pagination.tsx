import { ReactNode } from "react";

// Page links for /games: ← Previous, 1 … 4 5 6 … 12, Next →. Each is a real link
// (/games?page=5) so pages can be shared and opened in a new tab; a plain click switches
// page without reloading.
export default function Pagination({ page, pages, onPage, hrefFor = (n) => (n === 1 ? "/games" : `/games?page=${n}`) }: {
  page: number; pages: number; onPage: (page: number) => void; hrefFor?: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const link = (n: number, label: ReactNode, extra?: { rel?: string; "aria-label"?: string }) => (
    <a
      key={`${n}-${String(label)}`}
      href={hrefFor(n)}
      aria-current={n === page && typeof label === "number" ? "page" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab: let the browser do it
        e.preventDefault();
        onPage(n);
      }}
      {...extra}
    >
      {label}
    </a>
  );

  // First, last, and two either side of the current page; gaps become "…".
  const shown = [...new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);

  return (
    <nav className="pagination" aria-label="Pages">
      {page > 1 ? link(page - 1, "← Previous", { rel: "prev", "aria-label": "Previous page" }) : <span className="off">← Previous</span>}
      <span className="numbers">
        {shown.map((n, i) => (
          <span key={n} className="slot">
            {i > 0 && n - shown[i - 1] > 1 && <span className="gap">…</span>}
            {link(n, n, { "aria-label": `Page ${n}` })}
          </span>
        ))}
      </span>
      {page < pages ? link(page + 1, "Next →", { rel: "next", "aria-label": "Next page" }) : <span className="off">Next →</span>}
    </nav>
  );
}

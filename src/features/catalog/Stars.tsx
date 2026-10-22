/** Stars as text: "★★★★☆ 4.2 (31)". Shown only once a game has enough ratings (the API sends rating_avg then). */
export default function Stars({ avg, count }: { avg: number | null; count: number }) {
  if (avg === null) return null;
  const full = Math.round(avg);
  return (
    <span className="stars" title={`${avg} out of 5, from ${count} ratings`}>
      <span aria-hidden="true">{"★".repeat(full)}{"☆".repeat(5 - full)}</span> {avg} <span className="note">({count})</span>
    </span>
  );
}

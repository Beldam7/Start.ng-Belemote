// A game card's shape in grey, shown while the games load from the API.
export function GameSkeleton() {
  return (
    <article className="game skeleton-card" aria-hidden="true">
      <div className="art skeleton" />
      <div className="info">
        <span className="skeleton line title" />
        <span className="skeleton line host" />
        <span className="skeleton line by" />
      </div>
      <div className="meta"><span className="skeleton line action" /></div>
    </article>
  );
}

/** `count` placeholder cards. The wrapper tells screen readers the list is loading. */
export function SkeletonCards({ count }: { count: number }) {
  return (
    <>
      <span className="sr-only" role="status">Loading games…</span>
      {Array.from({ length: count }, (_, i) => <GameSkeleton key={i} />)}
    </>
  );
}

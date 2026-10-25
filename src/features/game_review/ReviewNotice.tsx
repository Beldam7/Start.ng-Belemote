import { useEffect, useState } from "react";
import type { YourGameProps } from "../registry";
import { mine, type Review } from "./api";

// On the owner's game in Your games: waiting for review, or not approved and why.
export default function ReviewNotice({ game }: YourGameProps) {
  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    if (game.hidden !== "in_review") return setReview(null);
    mine().then((rows) => setReview(rows.find((r) => r.game === game.name) ?? null));
  }, [game.name, game.hidden]);

  if (!review) return null;
  if (review.status === "pending") {
    return (
      <div className="update-problem review-notice" role="status">
        <b>In review</b>
        <span>A start.ng admin looks at every new game before it's listed. We'll email you. Meanwhile its address works, so you can keep testing it.</span>
      </div>
    );
  }
  return (
    <div className="update-problem review-notice" role="status">
      <b>Not approved yet</b>
      <span><b>Why:</b> {review.reason_label}</span>
      {review.note && <span>From our team: <i>{review.note}</i></span>}
      <span>Fix it and push to your repo: start.ng updates it and it goes back in the queue by itself.</span>
    </div>
  );
}

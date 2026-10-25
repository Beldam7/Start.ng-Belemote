// F2 game review (Hamzat): the admin tab "Game review" and the owner's notice in Your games. The rules run on the API
// (app/features/game_review).
import { lazy, Suspense } from "react";
import { registerAdminTab, registerYourGamePart, type AdminTabProps } from "../registry";
import ReviewNotice from "./ReviewNotice";

const ReviewTab = lazy(() => import("./ReviewTab"));

registerAdminTab({
  feature: "game_review",
  key: "game-review",
  label: "Game review",
  order: 14,
  permission: "games.review",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <ReviewTab {...props} />
    </Suspense>
  ),
});

registerYourGamePart({ feature: "game_review", key: "game-review", Component: ReviewNotice });

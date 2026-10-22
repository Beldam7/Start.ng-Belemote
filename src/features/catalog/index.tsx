// T1 categories, ratings and filters (Hamzat, for Tega). The flag is "catalog" (startng-be app/features/catalog; rating
// also needs "progress"). Adds: the category chip and stars on game cards, "Rate it" on a game's page, a category
// picker in Your games, an admin tab to remove ratings, and the /games filters (see filters.tsx, used by App.tsx).
import { lazy, Suspense } from "react";
import { registerAdminTab, registerCardPart, registerPagePart, registerYourGamePart, type AdminTabProps } from "../registry";
import { CardStars, CategoryChip } from "./CardParts";
import CategoryPicker from "./CategoryPicker";
import RatingBox from "./RatingBox";
import "./catalog.css";

const RatingsTab = lazy(() => import("./RatingsTab"));
const FEATURE = "catalog";

registerCardPart({ feature: FEATURE, key: "category", slot: "badges", render: (game) => <CategoryChip game={game} /> });
registerCardPart({ feature: FEATURE, key: "stars", slot: "stats", render: (game) => <CardStars game={game} /> });
registerPagePart({ feature: FEATURE, key: "rating", page: "game", Component: RatingBox });
registerYourGamePart({ feature: FEATURE, key: "category", Component: CategoryPicker });
registerAdminTab({
  feature: FEATURE,
  key: "ratings",
  label: "Ratings",
  order: 60,
  permission: "ratings.moderate",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <RatingsTab {...props} />
    </Suspense>
  ),
});

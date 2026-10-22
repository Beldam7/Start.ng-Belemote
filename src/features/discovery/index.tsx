// A1 discovery (Hamzat, for Ade). The flag is "discovery" (startng-be app/features/discovery). Adds the homepage shelves,
// "Play next" on a game's page, the "To be featured" checklist in Your games, and an admin tab to choose featured games.
import { lazy, Suspense } from "react";
import { registerAdminTab, registerPagePart, registerYourGamePart, type AdminTabProps } from "../registry";
import FeatureChecklist from "./FeatureChecklist";
import PlayNext from "./PlayNext";
import Shelves from "./Shelves";
import "./discovery.css";

const FeaturedTab = lazy(() => import("./FeaturedTab"));
const FEATURE = "discovery";

registerPagePart({ feature: FEATURE, key: "shelves", page: "home", Component: Shelves });
registerPagePart({ feature: FEATURE, key: "play-next", page: "game", order: 200, Component: PlayNext });
registerYourGamePart({ feature: FEATURE, key: "featuring", order: 60, Component: FeatureChecklist });
registerAdminTab({
  feature: FEATURE,
  key: "featured",
  label: "Featured",
  order: 70,
  permission: "featured.edit",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <FeaturedTab {...props} />
    </Suspense>
  ),
});

// H2 game health (Hamzat): the admin tab "Game health" and the owner's "Not loading" notice in Your games.
// The checks run on the API (app/features/game_health).
import { lazy, Suspense } from "react";
import { registerAdminTab, registerYourGamePart, type AdminTabProps } from "../registry";
import HealthNotice from "./HealthNotice";

const HealthTab = lazy(() => import("./HealthTab"));

registerAdminTab({
  feature: "game_health",
  key: "game-health",
  label: "Game health",
  order: 17,
  permission: "games.health",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <HealthTab {...props} />
    </Suspense>
  ),
});

registerYourGamePart({ feature: "game_health", key: "game-health", Component: HealthNotice });

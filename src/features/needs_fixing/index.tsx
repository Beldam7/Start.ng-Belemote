// H2 "needs fixing" (Hamzat): an admin tab to mark and review games, and the owner's notice in Your games.
// The rules run on the API (app/features/needs_fixing).
import { lazy, Suspense } from "react";
import { registerAdminTab, registerYourGamePart, type AdminTabProps } from "../registry";
import FixNotice from "./FixNotice";

const NeedsFixingTab = lazy(() => import("./NeedsFixingTab"));

registerAdminTab({
  feature: "needs_fixing",
  key: "needs-fixing",
  label: "Needs fixing",
  order: 15,
  permission: "games.needs_fixing",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <NeedsFixingTab {...props} />
    </Suspense>
  ),
});

registerYourGamePart({ feature: "needs_fixing", key: "needs-fixing", Component: FixNotice });

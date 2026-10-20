// H2 name filter (Hamzat): its admin tab. The filter itself runs on the API (app/features/moderation).
import { lazy, Suspense } from "react";
import { registerAdminTab, type AdminTabProps } from "../registry";

// The tab's code only downloads when an admin opens it.
const NameFilterTab = lazy(() => import("./NameFilterTab"));

registerAdminTab({
  feature: "moderation",
  key: "name-filter",
  label: "Name filter",
  order: 30,
  permission: "moderation.words",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <NameFilterTab {...props} />
    </Suspense>
  ),
});

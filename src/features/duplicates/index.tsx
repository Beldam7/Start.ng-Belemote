// H2 duplicate finder (Hamzat): the admin tab, and the owner's notice in Your games. Matching runs on the API
// (app/features/duplicates).
import { lazy, Suspense } from "react";
import { registerAdminTab, registerYourGamePart, type AdminTabProps } from "../registry";
import CopyNotice from "./CopyNotice";

const DuplicatesTab = lazy(() => import("./DuplicatesTab"));

registerAdminTab({
  feature: "duplicates",
  key: "duplicates",
  label: "Duplicates",
  order: 16,
  permission: "games.duplicates",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <DuplicatesTab {...props} />
    </Suspense>
  ),
});

registerYourGamePart({ feature: "duplicates", key: "duplicates", Component: CopyNotice });

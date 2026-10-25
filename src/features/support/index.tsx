// F10 support (Hamzat): a Help button on every page (search the docs, report a problem with start.ng) and the admin tab
// "Problem reports". The rules run on the API (app/features/support). AI answers from the docs come later.
import { lazy, Suspense } from "react";
import { registerAdminTab, registerPagePart, type AdminTabProps } from "../registry";
import HelpButton from "./HelpButton";

const ProblemReportsTab = lazy(() => import("./ProblemReportsTab"));

registerPagePart({ feature: "support", key: "help", page: "everywhere", Component: HelpButton });

registerAdminTab({
  feature: "support",
  key: "problem-reports",
  label: "Problem reports",
  order: 12,
  permission: "support.reports",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <ProblemReportsTab {...props} />
    </Suspense>
  ),
});

// Private tournaments (PRD Tr1): friends pick games and a window, share an invite link and follow their own standings.
// The flag is "private_tournaments" (the same as NAME in startng-be app/features/private_tournaments).
import { createElement, lazy, Suspense } from "react";
import { registerAdminTabPart, registerPage, type AdminTabProps } from "../registry";

const FEATURE = "private_tournaments";

registerPage({ feature: FEATURE, path: "/friends", shell: "app", load: () => import("./MyTournaments") });
registerPage({ feature: FEATURE, path: /^\/friends\/(?<code>[\w-]{8,16})\/?$/, shell: "app", load: () => import("./TournamentPage") });

// F9: admins make tournaments to share in a group (only people who register see them). It's a section of the admin
// page's Tournaments tab, not a tab of its own.
const AdminTournaments = lazy(() => import("./AdminTournaments"));
registerAdminTabPart({
  feature: FEATURE,
  tab: "tournaments",
  key: "private-tournaments",
  permission: "tournaments.private",
  Component: (props: AdminTabProps) => createElement(Suspense, { fallback: null }, createElement(AdminTournaments, props)),
});

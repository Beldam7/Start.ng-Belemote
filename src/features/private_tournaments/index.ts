// Private tournaments (PRD Tr1): friends pick games and a window, share an invite link and follow their own standings.
// The flag is "private_tournaments" (the same as NAME in startng-be app/features/private_tournaments).
import { createElement, lazy, Suspense } from "react";
import { registerAdminTab, registerPage, type AdminTabProps } from "../registry";

const FEATURE = "private_tournaments";

registerPage({ feature: FEATURE, path: "/friends", shell: "app", load: () => import("./MyTournaments") });
registerPage({ feature: FEATURE, path: /^\/friends\/(?<code>[\w-]{8,16})\/?$/, shell: "app", load: () => import("./TournamentPage") });

// F9: admins make tournaments to share in a group (only people who register see them).
const AdminTournaments = lazy(() => import("./AdminTournaments"));
registerAdminTab({
  feature: FEATURE,
  key: "private-tournaments",
  label: "Private tournaments",
  order: 31,
  permission: "tournaments.private",
  Component: (props: AdminTabProps) => createElement(Suspense, { fallback: null }, createElement(AdminTournaments, props)),
});

// Private tournaments (PRD Tr1): friends pick games and a window, share an invite link and race on their own standings.
// The flag is "private_tournaments" (the same as NAME in startng-be app/features/private_tournaments).
import { registerPage } from "../registry";

const FEATURE = "private_tournaments";

registerPage({ feature: FEATURE, path: "/t", shell: "app", load: () => import("./MyTournaments") });
registerPage({ feature: FEATURE, path: /^\/t\/(?<code>[\w-]{8,16})\/?$/, shell: "app", load: () => import("./TournamentPage") });

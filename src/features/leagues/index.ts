// Leagues (M2): three tracks (Sprint 2h, Daily 24h, Weekly 7d), groups of up to 30 per tier, top 5 up, bottom 5 down.
// The flag is "leagues" (the same as NAME in startng-be app/features/leagues).
import { registerPage, registerProfileSection } from "../registry";
import LeagueSection from "./LeagueSection";

const FEATURE = "leagues";

// Your group table, countdown and history for each track.
registerPage({ feature: FEATURE, path: "/league", shell: "app", load: () => import("./LeaguePage") });
// Your tier in each track on your own profile (shown by the profile page, S1).
registerProfileSection({ feature: FEATURE, key: "leagues", title: "League", Component: LeagueSection });

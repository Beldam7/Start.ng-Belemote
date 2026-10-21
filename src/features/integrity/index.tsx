// Score integrity (PRD D2): runs that look too good to be true are held back, and admins decide here.
// The flag is "integrity" (the same as NAME in startng-be app/features/integrity); the permission is scores.review.
import { registerAdminTab } from "../registry";
import ScoreFlagsTab from "./ScoreFlagsTab";

const FEATURE = "integrity";

registerAdminTab({ feature: FEATURE, key: "score-flags", label: "Score flags", order: 16, permission: "scores.review", Component: ScoreFlagsTab });

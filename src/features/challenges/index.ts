// Challenge links (PRD B1): start.ng/c/<code>, "beat my score". The flag is "challenges" (the same as NAME in
// startng-be app/features/challenges). Other places use <ChallengeButton game /> to make one.
import { registerPage } from "../registry";

const FEATURE = "challenges";

registerPage({ feature: FEATURE, path: /^\/c\/(?<code>[\w-]{8,16})\/?$/, shell: "app", load: () => import("./ChallengePage") });

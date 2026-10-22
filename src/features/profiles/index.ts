// Player profiles and badges (PRD S1, built by Hamzat for Seyi). The flag is "profiles" (startng-be app/features/profiles).
// Other features add a section to a profile with registerProfileSection (../registry.ts), which this page shows.
import { registerPage } from "../registry";

const FEATURE = "profiles";

// start.ng/p/<id>-<name> (the name is only for looks), and /me for your own page.
registerPage({ feature: FEATURE, path: /^\/p\/(?<id>\d{1,10})(-[\w-]*)?\/?$/, shell: "app", load: () => import("./ProfilePage") });
registerPage({ feature: FEATURE, path: "/me", shell: "app", load: () => import("./ProfilePage") });

// Admin Features tab: super admins switch features on and off without a redeploy (startng-be app/routers/feature_switches.py).
// It is not behind a flag itself: it is how flags are changed.
import { registerAdminTab } from "../registry";
import FeaturesTab from "./FeaturesTab";

registerAdminTab({ feature: null, key: "features", label: "Features", order: 950, superOnly: true, Component: FeaturesTab });

// Share cards (PRD B2): start.ng/s/<kind>/<id> links and the <ShareButton kind id /> other features show.
// The flag is "share_cards" (the same as NAME in startng-be app/features/share_cards).
import { registerPage } from "../registry";

const FEATURE = "share_cards";

registerPage({ feature: FEATURE, path: /^\/s\/(?<kind>[a-z_]{1,32})\/(?<id>[A-Za-z0-9_-]{1,64})\/?$/, shell: "app", load: () => import("./SharePage") });
// A preview of any card in both sizes, with its Share button: only in `npm run dev`, never on the live site.
if (import.meta.env.DEV) registerPage({ feature: FEATURE, path: "/share-preview", shell: "app", load: () => import("./PreviewPage") });

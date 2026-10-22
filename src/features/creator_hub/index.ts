// Creator hub (PRD T2, built by Hamzat for Tega). The flag is "creator_hub" (startng-be app/features/creator_hub).
// /by/<id>-<name> is a creator's page, /by the top creators, and Your games gets each game's numbers.
import { registerPage, registerYourGamePart } from "../registry";
import YourStats from "./YourStats";

const FEATURE = "creator_hub";

registerPage({ feature: FEATURE, path: /^\/by\/(?<id>\d{1,10})(-[\w-]*)?\/?$/, shell: "app", load: () => import("./CreatorPage") });
registerPage({ feature: FEATURE, path: "/by", shell: "app", load: () => import("./CreatorsBoard") });
registerYourGamePart({ feature: FEATURE, key: "stats", order: 50, Component: YourStats });

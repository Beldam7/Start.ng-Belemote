// F1 the start.ng GitHub App (Hamzat): a link in Your games to install it, so a push goes live straight away.
// The webhook runs on the API (app/features/github_app).
import { registerYourGamePart } from "../registry";
import InstantUpdates from "./InstantUpdates";

registerYourGamePart({ feature: "github_app", key: "github-app", order: 200, Component: InstantUpdates });

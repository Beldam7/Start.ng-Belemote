// Wardrobe: coins, items with rarities and the daily shop. The flag is "wardrobe" (startng-be app/features/wardrobe).
// Also, outside this folder and only while the flag is on: the coin counter and menu links (AccountMenu.tsx), the
// Wardrobe tab of the profile (CharacterCreator.tsx) and the unlock popup (App.tsx).
import { registerPage, registerProfileSection } from "../registry";
import WardrobeSection from "./WardrobeSection";

const FEATURE = "wardrobe";

// Your coins and where they came from, and every item: yours to wear and the ones still to get.
registerPage({ feature: FEATURE, path: "/wardrobe", shell: "app", load: () => import("./WardrobePage") });
// Today's stock, the featured picks 20% off.
registerPage({ feature: FEATURE, path: "/shop", shell: "app", load: () => import("./ShopPage") });
// What a player wears and their three rarest items (shown by the profile page, S1).
registerProfileSection({ feature: FEATURE, key: "wardrobe", title: "Wardrobe", Component: WardrobeSection });

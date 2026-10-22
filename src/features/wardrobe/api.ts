// The wardrobe's API calls (startng-be app/features/wardrobe). Every route is a 404 while the flag is off.
import { call, send } from "../../api";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "limited";
export type Slot = "hat" | "accessory" | "outfit" | "neck" | "back" | "aura";

export type Item = {
  key: string; name: string; slot: Slot; rarity: Rarity;
  how: string; // how to get it, shown on locked items
  price: number | null; // today's shop price; null = not in the shop today
  owned_share: number; // 0 to 1
};
export type Entry = { amount: number; reason: string; ref: string; at: string };
export type Wallet = { balance: number; earned_today: number; daily_cap: number; entries: Entry[] };
export type Wardrobe = {
  owned: { key: string; source: "earned" | "shop" | "admin" }[];
  worn: Partial<Record<Slot, string>>;
  style: Record<string, unknown>; // what games get
};
export type PublicWardrobe = { worn: Partial<Record<Slot, string>>; showcase: string[]; items_owned: number };
export type Shop = { day: string; featured: Item[]; items: Item[] };

const token = () => localStorage.getItem("token");

export const getItems = () => call<Item[]>(null, "/wardrobe/items");
export const getShop = () => call<Shop>(null, "/shop");
export const getWallet = () => call<Wallet>(token(), "/me/wallet");
export const getWardrobe = () => call<Wardrobe>(token(), "/me/wardrobe");
export const getPlayerWardrobe = (id: number) => call<PublicWardrobe>(null, `/players/${id}/wardrobe`);
export const wear = (item: string) => call<Wardrobe>(token(), "/me/wardrobe/wear", send("POST", { item }));
export const takeOff = (slot: Slot) => call<Wardrobe>(token(), "/me/wardrobe/take-off", send("POST", { slot }));
export const buy = (item: string) => call<{ balance: number; item: string }>(token(), "/shop/buy", send("POST", { item }));

/** Tell the coin counter and the unlock popup that coins or items changed (a purchase, wearing something). */
export const changed = () => window.dispatchEvent(new Event("wardrobe:changed"));

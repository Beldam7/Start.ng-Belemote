// A player's character: one look that every game on start.ng uses.
// The style field names and values are what games build against.
export type CharacterStyle = {
  primaryColor: string; // top
  secondaryColor: string; // bottoms
  skinColor: string;
  hairColor: string;
  hair: "short" | "afro" | "braids" | "bun" | "bald";
  hat: "none" | "cap" | "beanie" | "tophat" | "crown";
  accessory: "none" | "glasses" | "scarf" | "backpack";
};

export type Character = { name: string; style: CharacterStyle };

export const SKINS = ["#5c3a21", "#8d5524", "#a0662f", "#c68642", "#e0ac69", "#f1c27d"];
export const HAIR_COLORS = ["#17120f", "#4a2c1a", "#8b5a2b", "#d9a441", "#b8b8b8", "#c0392b"];
export const TOPS = ["#ff6b6b", "#1dd1a1", "#a55eea", "#4b7bec", "#f7b731", "#fd9644", "#eb3b5a", "#292a23"];
export const BOTTOMS = ["#2b2f4a", "#222f3e", "#3d3d3d", "#4b6584", "#5f3dc4", "#0c6e5a"];
export const HAIRS: CharacterStyle["hair"][] = ["short", "afro", "braids", "bun", "bald"];
export const HATS: CharacterStyle["hat"][] = ["none", "cap", "beanie", "tophat", "crown"];
export const ACCESSORIES: CharacterStyle["accessory"][] = ["none", "glasses", "scarf", "backpack"];

function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}

/** A starting look worked out from the account id, used until the player makes their own. */
export function styleFor(userId: number): CharacterStyle {
  const pick = <T,>(list: T[], salt: number) => list[hash(userId * 31 + salt) % list.length];
  return {
    primaryColor: pick(TOPS, 1),
    secondaryColor: pick(BOTTOMS, 2),
    skinColor: pick(SKINS, 3),
    hairColor: pick(HAIR_COLORS, 6),
    hair: pick(HAIRS, 7),
    hat: "none",
    accessory: "none",
  };
}

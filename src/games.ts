// Games shown on the homepage. Each one is served from its own folder at https://<slug>.start.ng
export type Game = { slug: string; title: string; tagline: string; genre: string; by: string; colors: [string, string] };

export const games: Game[] = [
  { slug: "relichunter", title: "Relic Hunter", tagline: "Raid a lost temple, grab the golden idol and outrun the boulder.", genre: "Adventure", by: "Chloetrini", colors: ["#e2c178", "#5a3a12"] },
  { slug: "streethustle", title: "Street Hustle", tagline: "Fight street gangs for cash, gear up and take down the boss.", genre: "Action", by: "Chloetrini", colors: ["#ffd400", "#e10600"] },
  { slug: "mamasbuka", title: "Mama's Buka", tagline: "Cook jollof, amala and suya fast, serve the queue and grow your buka.", genre: "Cooking", by: "Chloetrini", colors: ["#ff9f1c", "#2ec4b6"] },
  { slug: "aje", title: "AJE", tagline: "A Nigerian night tale of witches, vampires and one brave town.", genre: "Story", by: "Chloetrini", colors: ["#9b5de5", "#1b1035"] },
];

export const gameUrl = (slug: string) => `https://${slug}.start.ng`;

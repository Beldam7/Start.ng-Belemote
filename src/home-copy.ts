// The homepage's About and questions. The API writes the same words into the homepage for search engines and AI
// tools before the app loads (startng-be app/routers/pages.py, HOME_ABOUT and HOME_QUESTIONS): keep them in step.
export const ABOUT = [
  "start.ng is Nigeria's home for browser games, built by the HNG community. Every game is free to play in your browser with no download, and many are made in Naija: danfo rush hour, jollof catching, Lagos markets and more.",
  "We're also building a home for web games from across Africa. If you make games anywhere on the continent, you can put yours on start.ng for free.",
];

export const QUESTIONS: [string, string][] = [
  ["What is start.ng?", "A home for free browser games made by the HNG community. Each game has its own address, like yourgame.start.ng, and you play it right in your browser."],
  ["Is it free?", "Yes. Every game on start.ng is free to play in your browser, with nothing to download."],
  ["Are there Nigerian or African web games?", "Yes. Many games here are Naija-themed, from danfo rush hour to jollof and Lagos markets, and we welcome games from across Africa."],
  ["Do I need an account to play?", "No. Sign in to get your start.ng character, keep your scores on the leaderboards and join the daily tournament."],
  ["What is the daily tournament?", "Every day a few start.ng games are picked for 24 hours, and the best player wins. Points count towards the overall leaderboard."],
  ["How do I put my game on start.ng?", "Push your browser game to a public GitHub repo, publish it with one API call and approve it once. It goes live at yourgame.start.ng. The docs have every step."],
];

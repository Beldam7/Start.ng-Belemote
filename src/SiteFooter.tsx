import { useFeatures } from "./features/flags";

/** The site's footer, on every page the app draws. The server writes the same footer on its own pages (startng-be app/server_html.py,
 *  site_footer): keep the words and links the same in both. Categories shows only while the tags feature is on, like the server's. */
export default function SiteFooter() {
  const isOn = useFeatures();
  return (
    <footer className="container site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <a className="logo" href="/"><b>start<span>.ng</span></b></a>
          <p>Nigeria's home for free browser games. Play in your browser, with nothing to download.</p>
        </div>
        <nav aria-label="Play">
          <h2>Play</h2>
          <ul>
            <li><a href="/games">All games</a></li>
            <li><a href="/tournament">Daily tournament</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            {isOn("tags") && <li><a href="/categories">Categories</a></li>}
            <li><a href="/hangout">The Hangout</a></li>
          </ul>
        </nav>
        <nav aria-label="Make games">
          <h2>Make games</h2>
          <ul>
            <li><a href="/creators">Independent creators</a></li>
            <li><a href="/docs">Build a game</a></li>
            <li><a href="/docs.md">Docs for your AI (.md)</a></li>
          </ul>
        </nav>
        <nav aria-label="About">
          <h2>About</h2>
          <ul>
            <li><a href="/#about">About start.ng</a></li>
          </ul>
        </nav>
      </div>
      <p className="site-footer-base">
        <span>© {new Date().getFullYear()} start.ng</span>
        <span>Free to play. Nothing to download.</span>
      </p>
    </footer>
  );
}

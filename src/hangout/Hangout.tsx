import { useEffect, useRef } from "react";
import { startHangout } from "./game";
import "./hangout.css";

// The Hangout: start.ng's own game, an open park where everyone signed in hangs out together.
// It lives at /hangout. The game itself is in game.ts; this is the page around it.
export default function Hangout() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "The Hangout · start.ng";
    return startHangout(rootRef.current!);
  }, []);

  return (
    <div className="hangout" ref={rootRef}>
      <canvas className="hangout-scene" />

      <header className="hangout-hud">
        <a className="hangout-brand" href="/"><b>start<span>.ng</span></b> hangout</a>
        <span className="hangout-online" hidden />
      </header>
      <p className="hangout-status" hidden />
      <p className="hangout-hint" hidden>
        <b>WASD</b> or arrows to walk · <b>Shift</b> to run · <b>drag</b> to look · <b>Space</b> to wave
      </p>

      <div className="hangout-overlay">
        <div className="hangout-panel">
          <h1>The Hangout</h1>
          <p>Coming in…</p>
          <button hidden />
        </div>
      </div>
    </div>
  );
}

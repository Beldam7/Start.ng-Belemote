import Mascot from "./Mascot";

// The playground around the homepage heading: a few game things drawn in one style (ink outline, flat fills,
// lime for the highlights) that float at their own pace. It holds no words, so the page says the same thing
// with or without it. On wide screens the things sit either side of the heading; on phones only the ghost and a
// sparkle stay, at the top corners above it. The look is in styles.css (.hero-art, .hd).
export default function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="shooting-star shooting-star-a" aria-hidden="true" />
      <span className="shooting-star shooting-star-b" aria-hidden="true" />
      <span className="shooting-star shooting-star-c" aria-hidden="true" />
      <svg className="hd hd-blob hd-blob-l" viewBox="0 0 200 180" aria-hidden="true" focusable="false"><path d="M30 70 C20 30 70 6 110 14 C160 24 192 60 180 108 C170 150 120 176 74 166 C30 156 40 110 30 70 Z" /></svg>
      <svg className="hd hd-blob hd-blob-r" viewBox="0 0 200 180" aria-hidden="true" focusable="false"><path d="M20 96 C14 50 56 12 104 16 C152 20 190 52 184 100 C178 146 134 170 90 164 C44 158 24 136 20 96 Z" /></svg>

      <svg className="hd hd-controller" viewBox="0 0 160 112" aria-hidden="true" focusable="false">
        <path className="f-card" d="M46 24 H114 C136 24 149 42 153 68 C156 88 151 100 139 100 C127 100 121 90 113 82 H47 C39 90 33 100 21 100 C9 100 4 88 7 68 C11 42 24 24 46 24 Z" />
        <path d="M40 24 C40 14 52 12 62 14 M120 24 C120 14 108 12 98 14" />
        <path className="s-thick" d="M38 54 h16 M46 46 v16" />
        <circle className="f-lime" cx="112" cy="48" r="7" />
        <circle className="f-card" cx="126" cy="60" r="7" />
        <path d="M70 62 h8 M82 62 h8" />
      </svg>

      <svg className="hd hd-coin" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle className="f-lime" cx="32" cy="32" r="26" />
        <circle cx="32" cy="32" r="17" />
        <path d="M26 24 C28 21 31 20 34 20" />
      </svg>

      <svg className="hd hd-sparkle hd-sparkle-a" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path className="f-lime" d="M24 3 C26 16 32 22 45 24 C32 26 26 32 24 45 C22 32 16 26 3 24 C16 22 22 16 24 3 Z" /></svg>
      <svg className="hd hd-sparkle hd-sparkle-b" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path className="f-lime" d="M24 3 C26 16 32 22 45 24 C32 26 26 32 24 45 C22 32 16 26 3 24 C16 22 22 16 24 3 Z" /></svg>

      <Mascot className="hd hd-mascot" />

      <svg className="hd hd-die" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
        <rect className="f-card" x="6" y="6" width="60" height="60" rx="15" />
        <circle className="f-ink" cx="23" cy="23" r="4.5" /><circle className="f-ink" cx="49" cy="23" r="4.5" /><circle className="f-ink" cx="36" cy="36" r="4.5" />
        <circle className="f-ink" cx="23" cy="49" r="4.5" /><circle className="f-ink" cx="49" cy="49" r="4.5" />
      </svg>

      <svg className="hd hd-heart" viewBox="0 0 60 56" aria-hidden="true" focusable="false">
        <path className="f-lime" d="M30 51 C8 35 4 21 10 12 C16 4 28 6 30 16 C32 6 44 4 50 12 C56 21 52 35 30 51 Z" />
        <path d="M17 18 C19 15 22 14 25 15" />
      </svg>
    </div>
  );
}

/** A dashed trail from the buttons down towards the games, drawn in once the page loads. */
export function HeroTrail() {
  return (
    <svg className="hero-trail" viewBox="0 0 60 96" aria-hidden="true" focusable="false">
      <path className="trail-line" d="M30 4 C8 24 52 42 30 70" pathLength="1" />
      <path className="trail-head" d="M19 62 L30 76 L41 62" />
    </svg>
  );
}

// A pixel picture for the backdrop: "#" is a filled square, "." is a hole. A smiley that bobs.
const SMILEY = ["...#####...", ".##.....##.", ".#.......#.", "#..#...#..#", "#.........#", "#.#.....#.#", "#..#####..#", ".#.......#.", ".##.....##.", "...#####..."];

function Pixels({ rows, className }: { rows: string[]; className: string }) {
  return (
    <svg className={`bg-pixel ${className}`} viewBox={`0 0 11 ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rows.flatMap((row, y) => [...row].map((c, x) => c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null))}
    </svg>
  );
}

function Palm({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 80 112" aria-hidden="true" focusable="false">
      <path className="trunk" d="M40 110 C38 82 45 58 40 34" />
      <path className="f-lime" d="M40 34 C28 18 10 20 4 30 C16 26 28 28 40 34 Z M40 34 C52 18 70 20 76 30 C64 26 52 28 40 34 Z M40 34 C34 14 40 4 46 2 C46 14 44 24 40 34 Z M40 34 C24 30 12 40 10 54 C20 44 30 40 40 34 Z M40 34 C56 30 68 40 70 54 C60 44 50 40 40 34 Z" />
      <circle className="f-ink" cx="37" cy="39" r="3" /><circle className="f-ink" cx="44" cy="40" r="3" />
    </svg>
  );
}

const DOTS: [number, number, number][] = [[60, 70, 1.8], [150, 300, 1.4], [110, 520, 2], [200, 430, 1.6], [1140, 90, 1.8], [1060, 240, 1.4], [1100, 470, 2], [1170, 330, 1.6], [900, 590, 1.4]];
const SPARKS: [number, number][] = [[90, 210], [1110, 170]];

/** Behind everything in the hero: a dotted edge, twinkling stars, drifting clouds, a sun (or a moon in dark mode),
 *  a pixel smiley, and soft hills that fade into the games below. Home is Naija, so the hills have palm trees, a
 *  steaming pot of jollof and a danfo (the yellow Lagos bus, here with its black stripe) driving by. Decorative only, with no words. The look is in
 *  styles.css (.hero-bg). */
export function HeroBackdrop() {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="bg-dots" />
      <svg className="bg-hills" viewBox="0 0 1200 110" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="hill-back" d="M0 50 C120 14 260 70 420 42 S720 8 880 44 S1100 66 1200 30 V110 H0 Z" />
        <path className="hill-front" d="M0 74 C160 44 300 96 470 70 S780 40 930 72 S1120 90 1200 62 V110 H0 Z" />
      </svg>
      <svg className="bg-stars" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {DOTS.map(([x, y, r]) => <circle key={`d${x}${y}`} cx={x} cy={y} r={r} />)}
        {SPARKS.map(([x, y]) => <path key={`s${x}${y}`} className="spark" d={`M${x} ${y - 11} C${x + 1} ${y - 4} ${x + 4} ${y - 1} ${x + 11} ${y} C${x + 4} ${y + 1} ${x + 1} ${y + 4} ${x} ${y + 11} C${x - 1} ${y + 4} ${x - 4} ${y + 1} ${x - 11} ${y} C${x - 4} ${y - 1} ${x - 1} ${y - 4} ${x} ${y - 11} Z`} />)}
      </svg>
      {(["a"] as const).map((k) => (
        <svg key={k} className={`bg-cloud bg-cloud-${k}`} viewBox="0 0 120 50" aria-hidden="true" focusable="false"><path d="M22 42 C6 42 4 24 19 22 C19 8 40 4 48 17 C54 6 76 8 78 23 C94 19 108 32 96 42 Z" /></svg>
      ))}
      <svg className="bg-sun" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
        <g className="sun-rays"><path d="M30 4 v8 M30 48 v8 M4 30 h8 M48 30 h8 M12 12 l6 6 M42 42 l6 6 M48 12 l-6 6 M18 42 l-6 6" /></g>
        <circle className="f-lime" cx="30" cy="30" r="12" />
      </svg>
      <svg className="bg-moon" viewBox="0 0 60 60" aria-hidden="true" focusable="false"><path className="f-lime" d="M38 8 C22 10 14 26 21 40 C28 54 46 56 54 46 C38 46 30 30 38 8 Z" /></svg>
      <Palm className="bg-palm bg-palm-l" />
      <svg className="bg-pot" viewBox="0 0 70 80" aria-hidden="true" focusable="false">
        <path className="steam steam-1" d="M27 32 C22 26 31 22 26 13" />
        <path className="steam steam-2" d="M36 32 C31 25 40 21 35 10" />
        <path className="steam steam-3" d="M45 32 C40 27 48 23 44 15" />
        <path d="M10 46 C1 46 1 57 10 57 M60 46 C69 46 69 57 60 57" />
        <path className="f-card" d="M10 38 H60 C60 62 52 72 35 72 C18 72 10 62 10 38 Z" />
        <path className="f-lime" d="M11 48 H59 C58 52 57 55 55 58 H15 C13 55 12 52 11 48 Z" />
        <path className="f-card" d="M8 38 H62 C62 34 57 32 35 32 C13 32 8 34 8 38 Z" />
        <path d="M35 32 v-3" />
      </svg>
      <svg className="bg-stall" viewBox="0 0 100 90" aria-hidden="true" focusable="false">
        <path className="f-card" d="M8 34 L18 12 H82 L92 34 Z" />
        <path className="f-lime" d="M26 12 H42 L38 34 H20 Z M58 12 H74 L80 34 H62 Z" />
        <path className="f-card" d="M8 34 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0 q7 10 14 0" />
        <path d="M14 42 V82 M86 42 V82 M4 84 H96" />
        <rect className="f-card" x="10" y="62" width="80" height="20" rx="3" />
        <circle className="f-lime" cx="28" cy="56" r="6" /><circle className="f-card" cx="42" cy="57" r="5" /><circle className="f-lime" cx="56" cy="56" r="6" /><circle className="f-card" cx="70" cy="57" r="5" />
      </svg>
      <svg className="bg-okada" viewBox="0 0 110 72" aria-hidden="true" focusable="false">
        <g className="okada-body">
          <path d="M22 56 L38 38 H66 L88 56 M52 56 L38 38 M88 56 L80 30 H90" />
          <path className="f-ink" d="M34 35 h26 v4 h-26 z" />
          <path className="s-rider" d="M46 35 L50 20 M46 37 L62 47 L60 56 M50 24 L78 30" />
          <circle className="f-lime" cx="52" cy="13" r="7" />
          <g className="wheel wheel-1"><circle className="f-ink" cx="22" cy="56" r="11" /><path className="s-hub" d="M22 49 v14 M15 56 h14" /></g>
          <g className="wheel wheel-2"><circle className="f-ink" cx="88" cy="56" r="11" /><path className="s-hub" d="M88 49 v14 M81 56 h14" /></g>
        </g>
      </svg>
      <svg className="bg-danfo" viewBox="0 0 150 80" aria-hidden="true" focusable="false">
        <g className="danfo-body">
          <path className="f-lime" d="M8 60 V28 C8 20 14 16 22 16 H108 C118 16 124 22 130 34 L142 44 C146 47 146 52 146 60 Z" />
          <path className="s-stripe" d="M9 42 H143" />
          <path className="f-card" d="M18 22 h16 v14 h-16 Z M40 22 h16 v14 h-16 Z M62 22 h16 v14 h-16 Z M84 22 h16 v14 h-16 Z M108 22 h8 l12 12 h-20 Z" />
          <path d="M22 12 H96 M30 12 v4 M88 12 v4" />
          <circle className="f-card" cx="142" cy="50" r="3" />
          <g className="wheel wheel-1"><circle className="f-ink" cx="36" cy="62" r="11" /><path className="s-hub" d="M36 55 v14 M29 62 h14" /></g>
          <g className="wheel wheel-2"><circle className="f-ink" cx="116" cy="62" r="11" /><path className="s-hub" d="M116 55 v14 M109 62 h14" /></g>
        </g>
      </svg>
      <Pixels rows={SMILEY} className="bg-pixel-a" />
    </div>
  );
}

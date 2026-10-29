import Mascot from "./Mascot";

// The playground around the homepage heading: a few game things drawn in one style (ink outline, flat fills,
// lime for the highlights) that float at their own pace. It holds no words, so the page says the same thing
// with or without it. On wide screens the things sit either side of the heading; on phones they line up in a row
// under the buttons. The look is in styles.css (.hero-art, .hd).
export default function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="shooting-star shooting-star-a" />
      <span className="shooting-star shooting-star-b" />
      <span className="shooting-star shooting-star-c" />
      <svg className="hd hd-blob hd-blob-l" viewBox="0 0 200 180" focusable="false"><path d="M30 70 C20 30 70 6 110 14 C160 24 192 60 180 108 C170 150 120 176 74 166 C30 156 40 110 30 70 Z" /></svg>
      <svg className="hd hd-blob hd-blob-r" viewBox="0 0 200 180" focusable="false"><path d="M20 96 C14 50 56 12 104 16 C152 20 190 52 184 100 C178 146 134 170 90 164 C44 158 24 136 20 96 Z" /></svg>

      <svg className="hd hd-controller" viewBox="0 0 160 112" focusable="false">
        <path className="f-card" d="M46 24 H114 C136 24 149 42 153 68 C156 88 151 100 139 100 C127 100 121 90 113 82 H47 C39 90 33 100 21 100 C9 100 4 88 7 68 C11 42 24 24 46 24 Z" />
        <path d="M40 24 C40 14 52 12 62 14 M120 24 C120 14 108 12 98 14" />
        <path className="s-thick" d="M38 54 h16 M46 46 v16" />
        <circle className="f-lime" cx="112" cy="48" r="7" />
        <circle className="f-card" cx="126" cy="60" r="7" />
        <path d="M70 62 h8 M82 62 h8" />
      </svg>

      <svg className="hd hd-coin" viewBox="0 0 64 64" focusable="false">
        <circle className="f-lime" cx="32" cy="32" r="26" />
        <circle cx="32" cy="32" r="17" />
        <path d="M26 24 C28 21 31 20 34 20" />
      </svg>

      <svg className="hd hd-sparkle hd-sparkle-a" viewBox="0 0 48 48" focusable="false"><path className="f-lime" d="M24 3 C26 16 32 22 45 24 C32 26 26 32 24 45 C22 32 16 26 3 24 C16 22 22 16 24 3 Z" /></svg>
      <svg className="hd hd-sparkle hd-sparkle-b" viewBox="0 0 48 48" focusable="false"><path className="f-lime" d="M24 3 C26 16 32 22 45 24 C32 26 26 32 24 45 C22 32 16 26 3 24 C16 22 22 16 24 3 Z" /></svg>
      <svg className="hd hd-bit hd-bit-a" viewBox="0 0 16 16" focusable="false"><path d="M8 2 v12 M2 8 h12" /></svg>
      <svg className="hd hd-bit hd-bit-b" viewBox="0 0 16 16" focusable="false"><path d="M8 2 v12 M2 8 h12" /></svg>

      <Mascot className="hd hd-mascot" />

      <svg className="hd hd-die" viewBox="0 0 72 72" focusable="false">
        <rect className="f-card" x="6" y="6" width="60" height="60" rx="15" />
        <circle className="f-ink" cx="23" cy="23" r="4.5" /><circle className="f-ink" cx="49" cy="23" r="4.5" /><circle className="f-ink" cx="36" cy="36" r="4.5" />
        <circle className="f-ink" cx="23" cy="49" r="4.5" /><circle className="f-ink" cx="49" cy="49" r="4.5" />
      </svg>

      <svg className="hd hd-heart" viewBox="0 0 60 56" focusable="false">
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

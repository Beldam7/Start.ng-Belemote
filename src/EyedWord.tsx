import { useEffect, useRef } from "react";
import { watchLook } from "./look";

// A word in the homepage heading with each "o" drawn as an eye: awake in light mode, asleep in dark mode (one
// opens while you hover it, or while the pointer is close). The pupils follow the pointer and the eyes blink
// (src/look.ts). The letters stay in the heading, so the words are the same as the API's copy of
// the page; the brow, pupil and closed lid are empty, decorative spans. The look is in styles.css (.eye).
export default function EyedWord({ word }: { word: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const stops = [...ref.current!.querySelectorAll<HTMLElement>(".eye")].map(watchLook);
    return () => stops.forEach((stop) => stop());
  }, []);
  return (
    <span className="eye-word" ref={ref}>
      {[...word].map((ch, i) => ch === "o" ? (
        <span className="eye" key={i}>
          <span className="eye-face" aria-hidden="true">
            <span className="eye-brow" />
            <span className="eye-ball" />
            <span className="eye-lid" />
          </span>
          o
        </span>
      ) : ch)}
    </span>
  );
}

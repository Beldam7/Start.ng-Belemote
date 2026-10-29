import { useEffect, useRef } from "react";
import { watchLook } from "./look";

// start.ng's little ghost: a lime blob with a play button on its belly and big eyes that follow the pointer and
// blink (src/look.ts). Purely decorative, so it is hidden from screen readers. `sleepy` shuts its eyes, for empty
// states. The look is in styles.css (.mascot).
export default function Mascot({ sleepy = false, className = "" }: { sleepy?: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => (sleepy ? undefined : watchLook(ref.current!)), [sleepy]);
  return (
    <svg ref={ref} className={`mascot ${sleepy ? "sleepy" : ""} ${className}`.trim()} viewBox="0 0 140 156" aria-hidden="true" focusable="false">
      <path className="m-arm m-arm-l" d="M22 96 C10 98 6 88 10 80" />
      <g className="m-arm m-arm-r"><path d="M118 96 C130 98 134 88 130 80" /></g>
      <path className="m-body" d="M22 132 C10 92 14 54 38 34 C56 18 84 18 102 34 C126 54 130 92 118 132 C112 142 104 142 98 132 C92 142 82 142 76 132 C70 142 60 142 54 132 C48 142 38 142 32 132 C28 138 24 138 22 132 Z" />
      <path className="m-shine" d="M40 50 C46 42 56 38 64 38" />
      {sleepy ? (
        <>
          <path className="m-lid" d="M42 72 Q54 80 66 72" />
          <path className="m-lid" d="M76 72 Q88 80 100 72" />
        </>
      ) : (
        <>
          <g className="m-eye"><ellipse className="m-white" cx="54" cy="70" rx="14" ry="16" /><circle className="m-pupil" cx="54" cy="71" r="7" /><circle className="m-glint" cx="51" cy="67" r="2.2" /></g>
          <g className="m-eye"><ellipse className="m-white" cx="88" cy="70" rx="14" ry="16" /><circle className="m-pupil" cx="88" cy="71" r="7" /><circle className="m-glint" cx="85" cy="67" r="2.2" /></g>
        </>
      )}
      <path className="m-mouth" d="M63 98 Q71 105 79 98" />
      <path className="m-blush" d="M34 92 h8 M100 92 h8" />
      <path className="m-play" d="M66 110 L66 124 L78 117 Z" />
    </svg>
  );
}

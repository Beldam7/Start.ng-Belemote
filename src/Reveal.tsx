import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from "react";

// Things below the fold fade up as they scroll into view, once. Nothing is hidden unless it starts below the
// screen, the browser can watch it (IntersectionObserver) and motion is allowed, so without any of those the
// content is simply there. Things that come into view together arrive one after another. The look is in
// styles.css ([data-reveal]); the state lives in a data attribute, so React never overwrites it.

let observer: IntersectionObserver | null = null;

function watcher() {
  observer ??= new IntersectionObserver((entries) => {
    let n = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      el.style.setProperty("--reveal-delay", `${Math.min(n++, 6) * 70}ms`);
      el.dataset.reveal = "in";
      observer!.unobserve(el);
    }
  }, { rootMargin: "0px 0px -6% 0px" });
  return observer;
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.top < innerHeight) return; // already on screen, or not drawn: leave it alone
    el.dataset.reveal = "pending";
    const io = watcher();
    io.observe(el);
    return () => { io.unobserve(el); delete el.dataset.reveal; };
  }, []);
  return ref;
}

type Tag = "div" | "section" | "li" | "article";

/** An element that fades up when it scrolls into view. */
export function Reveal({ as: Tag = "div", ...props }: { as?: Tag } & ComponentPropsWithoutRef<"div">) {
  const ref = useReveal<HTMLElement>();
  const El = Tag as "div";
  return <El ref={ref as React.RefObject<HTMLDivElement>} {...props} />;
}

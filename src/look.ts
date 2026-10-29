// Things on the page that look at the pointer: the o's in the homepage heading (EyedWord.tsx) and the mascot
// (Mascot.tsx). Each one registered here gets two CSS variables, --look-x and --look-y, between -1 and 1: where the
// pointer is, seen from that thing. The look in styles.css turns them into a nudge of the pupil.
//
// One listener set and one animation frame loop serve all of them, and the loop only runs while something is still
// moving. With no pointer (a phone), they glance around now and then instead. Every few seconds they blink: the
// class "blink" is on them for a moment. An eye the pointer is near (or that was just touched) also gets "near",
// which wakes it in dark mode, where the eyes sleep. With reduced motion there is no glancing, blinking or easing.

const NEAR = 180; // px from the pointer where a sleeping eye wakes
const REACH = 150; // px from the pointer where the pupil is all the way to the side
const TOUCH_AWAKE = 2600; // ms an eye stays awake after a tap

const lookers = new Map<Element, { x: number; y: number }>();
let pointer: { x: number; y: number; touch: boolean } | null = null;
let moved = 0; // when the pointer last moved
let glance: { x: number; y: number } | null = null;
let awakeUntil = 0;
let frame = 0;
let glanceTimer = 0;
let blinkTimer = 0;
let wakeTimer = 0;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function tick() {
  frame = 0;
  const now = performance.now();
  const calm = reduced();
  let busy = false;
  for (const [el, cur] of lookers) {
    const r = el.getBoundingClientRect();
    let tx = 0, ty = 0, near = now < awakeUntil;
    if (r.bottom > 0 && r.top < innerHeight && (pointer || glance)) {
      const target = glance ?? pointer!;
      const dx = target.x - (r.left + r.width / 2), dy = target.y - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      if (glance) { tx = glance.x; ty = glance.y; }
      else {
        const reach = Math.min(1, dist / REACH);
        tx = (dx / dist) * reach; ty = (dy / dist) * reach;
        if (!pointer!.touch && dist < NEAR) near = true;
      }
    }
    const k = calm ? 1 : 0.2;
    const nx = cur.x + (tx - cur.x) * k, ny = cur.y + (ty - cur.y) * k;
    if (Math.abs(tx - nx) > 0.003 || Math.abs(ty - ny) > 0.003) busy = true;
    cur.x = Math.abs(tx - nx) > 0.003 ? nx : tx;
    cur.y = Math.abs(ty - ny) > 0.003 ? ny : ty;
    const style = (el as HTMLElement).style;
    style.setProperty("--look-x", cur.x.toFixed(3));
    style.setProperty("--look-y", cur.y.toFixed(3));
    el.classList.toggle("near", near);
  }
  if (busy) frame = requestAnimationFrame(tick);
}

const schedule = () => { if (!frame && lookers.size) frame = requestAnimationFrame(tick); };

function onPointer(e: PointerEvent) {
  pointer = { x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
  moved = performance.now();
  glance = null;
  if (e.type === "pointerdown" && pointer.touch) {
    awakeUntil = moved + TOUCH_AWAKE;
    clearTimeout(wakeTimer);
    wakeTimer = window.setTimeout(schedule, TOUCH_AWAKE + 50); // one more pass, to let them fall asleep again
  }
  schedule();
}

// A glance somewhere else, now and then, once the pointer has been still a while.
function nextGlance() {
  glanceTimer = window.setTimeout(() => {
    if (!document.hidden && performance.now() - moved > 3500) {
      glance = { x: Math.random() * 2 - 1, y: (Math.random() * 2 - 1) * 0.7 };
      schedule();
      glanceTimer = window.setTimeout(() => { glance = null; schedule(); nextGlance(); }, 900 + Math.random() * 900);
    } else nextGlance();
  }, 2500 + Math.random() * 3500);
}

function blink(times = 1) {
  for (const el of lookers.keys()) el.classList.add("blink");
  setTimeout(() => {
    for (const el of lookers.keys()) el.classList.remove("blink");
    if (times > 1) setTimeout(() => blink(times - 1), 130);
  }, 130);
}

function nextBlink() {
  blinkTimer = window.setTimeout(() => {
    if (!document.hidden) blink(Math.random() < 0.2 ? 2 : 1);
    nextBlink();
  }, 2800 + Math.random() * 3800);
}

function start() {
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("pointerdown", onPointer, { passive: true });
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  if (!reduced()) { nextGlance(); nextBlink(); }
}

function stop() {
  removeEventListener("pointermove", onPointer);
  removeEventListener("pointerdown", onPointer);
  removeEventListener("scroll", schedule);
  removeEventListener("resize", schedule);
  cancelAnimationFrame(frame);
  clearTimeout(glanceTimer); clearTimeout(blinkTimer); clearTimeout(wakeTimer);
  frame = 0; glance = null;
}

/** Make an element look at the pointer. Returns the function that stops it (call it when the element goes away). */
export function watchLook(el: HTMLElement | SVGElement): () => void {
  if (!lookers.size) start();
  lookers.set(el, { x: 0, y: 0 });
  schedule();
  return () => {
    lookers.delete(el);
    el.style.removeProperty("--look-x");
    el.style.removeProperty("--look-y");
    el.classList.remove("near", "blink");
    if (!lookers.size) stop();
  };
}

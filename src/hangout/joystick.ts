// The on-screen stick for phones and tablets. Put a thumb on it and drag: how far and which way
// you drag is how you walk, like WASD. Dragging the rest of the screen still looks around.
export type Stick = {
  /** How far the stick is pushed, sideways (x, right is +) and up and down (y, down is +), each from -1 to 1. Zero when let go. */
  read: () => { x: number; y: number };
  /** Lets go of the stick, as if the thumb came off (for when the page is left mid-walk). */
  release: () => void;
  dispose: () => void;
};

export function createJoystick(base: HTMLElement): Stick {
  const knob = base.querySelector<HTMLElement>(".hangout-joystick-knob");
  if (!knob) throw new Error("The joystick is missing its knob");
  let pointer: number | null = null;
  let x = 0;
  let y = 0;

  const place = () => {
    const travel = base.clientWidth * 0.32; // how far the knob can slide from the middle
    knob.style.transform = `translate(${x * travel}px, ${y * travel}px)`;
  };

  function move(e: PointerEvent) {
    const rect = base.getBoundingClientRect();
    const reach = rect.width * 0.4; // a drag this far from the middle is full push
    const dx = (e.clientX - (rect.left + rect.width / 2)) / reach;
    const dy = (e.clientY - (rect.top + rect.height / 2)) / reach;
    const length = Math.hypot(dx, dy);
    const scale = length > 1 ? 1 / length : 1;
    x = dx * scale;
    y = dy * scale;
    place();
  }

  function release(e: PointerEvent) {
    if (e.pointerId !== pointer) return;
    pointer = null;
    x = y = 0;
    place();
    base.classList.remove("held");
  }

  const down = (e: PointerEvent) => {
    if (pointer !== null) return;
    e.preventDefault();
    pointer = e.pointerId;
    try {
      base.setPointerCapture(e.pointerId); // keeps the drag going when the thumb slides off the stick
    } catch {
      // no such pointer (a pointer that has already gone): the drag still works while it stays on the stick
    }
    base.classList.add("held");
    move(e);
  };
  const drag = (e: PointerEvent) => {
    if (e.pointerId === pointer) move(e);
  };

  base.addEventListener("pointerdown", down);
  base.addEventListener("pointermove", drag);
  base.addEventListener("pointerup", release);
  base.addEventListener("pointercancel", release);

  return {
    read: () => ({ x, y }),
    release: () => {
      if (pointer !== null) release(new PointerEvent("pointercancel", { pointerId: pointer }));
    },
    dispose: () => {
      base.removeEventListener("pointerdown", down);
      base.removeEventListener("pointermove", drag);
      base.removeEventListener("pointerup", release);
      base.removeEventListener("pointercancel", release);
    },
  };
}

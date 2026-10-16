/** A phone or tablet: touch is the main way in, so the game shows an on-screen stick instead of asking for a keyboard. */
export function isTouchDevice(): boolean {
  if (matchMedia("(hover: none) and (pointer: coarse)").matches) return true;
  // Phones that report themselves otherwise, but not touch-screen laptops (their screens are bigger).
  return navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) <= 820;
}

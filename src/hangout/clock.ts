// The Hangout's clock and the sky both follow the time on the player's own device, in their own
// time zone. For trying out the sky, ?hour=22 (or 13.5) in the address pretends it is that hour
// here and the clock goes on from there.

const forcedHour = (() => {
  const raw = new URLSearchParams(location.search).get("hour");
  const hour = raw === null || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : null;
})();

const hourOf = (date: Date) => date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

/** The time now on the player's device (or the pretend time, see above). */
export function clockNow(): Date {
  const now = new Date();
  if (forcedHour === null) return now;
  return new Date(now.getTime() + (forcedHour - hourOf(now)) * 3600 * 1000);
}

/** The hour of the day now, 0 to 24 with fractions. */
export const hourNow = () => hourOf(clockNow());

/** Shows the time in `el`, in the player's time zone and the format their device uses, and keeps it going. Returns a function that stops it. */
export function startClock(el: HTMLElement): () => void {
  el.title = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const show = () => {
    el.textContent = clockNow().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  show();
  const timer = window.setInterval(show, 1000);
  return () => window.clearInterval(timer);
}

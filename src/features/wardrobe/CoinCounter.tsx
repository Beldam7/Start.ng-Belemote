import { useEffect, useState } from "react";
import { getWallet } from "./api";
import "./wardrobe.css";
import { coins } from "./words";

/** The signed-in player's coins in the top bar, linking to the shop. Refreshes when they come back to the tab (they
 *  may have earned some in a game) and after a purchase. Shows nothing until it has loaded. */
export default function CoinCounter({ userId }: { userId: number }) {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => { getWallet().then((w) => live && setBalance(w.balance)).catch(() => {}); };
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    load();
    window.addEventListener("wardrobe:changed", load);
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      window.removeEventListener("wardrobe:changed", load);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  if (balance === null) return null;
  return (
    <a className="wd-coins" href="/shop" aria-label={`${coins(balance)}. Open the shop`} title="Your coins: spend them in the shop">
      <span aria-hidden="true">🪙</span>
      <b>{balance.toLocaleString()}</b>
    </a>
  );
}

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { User } from "../../api";
import { styleFor } from "../../character";
import { getWallet, type Wallet } from "./api";
import { dressed, useWorn } from "./dress";
import WardrobePanel from "./WardrobePanel";
import { coins, reason } from "./words";

const Viewer = lazy(() => import("../../three/Viewer"));

/** The wardrobe tab of the shop: your coins and where they came from, and every item: yours to wear, and the ones still to get. */
export default function WardrobeTab({ user, onSignIn }: { user: User | null; onSignIn: () => void }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const worn = useWorn(user?.id ?? null);
  const base = useMemo(() => user?.character?.style ?? styleFor(user?.id ?? 0), [user]);
  const look = useMemo(() => dressed(base, worn ?? []), [base, worn]);
  useEffect(() => {
    if (user) getWallet().then(setWallet).catch(() => {});
  }, [user?.id]);

  return (
    <>
      {!user ? (
        <div className="board-empty">
          <p>Sign in to see your wardrobe.</p>
          <button type="button" onClick={onSignIn}>Sign in</button>
        </div>
      ) : (
        <>
          <div className="wd-top">
          <div className="wd-stage">
            <Suspense fallback={null}><Viewer style={look} className="wd-viewer" /></Suspense>
            <span className="note">What you wear shows in every game</span>
          </div>
          {wallet && (
            <div className="wd-wallet">
              <div className="wd-today">
                <span className="note">From playing today</span>
                <div className="wd-meter" role="meter" aria-valuemin={0} aria-valuemax={wallet.daily_cap} aria-valuenow={wallet.earned_today}
                  aria-label="Coins from playing today">
                  <span style={{ width: `${Math.min(100, (wallet.earned_today / wallet.daily_cap) * 100)}%` }} />
                </div>
                <span className="note">{wallet.earned_today} of {wallet.daily_cap}. Streaks, top places and tournaments don't count towards this.</span>
              </div>
              {wallet.entries.length > 0 && (
                <details className="wd-history">
                  <summary>Where your coins came from</summary>
                  <ul>
                    {wallet.entries.map((e, n) => (
                      <li key={n}>
                        <span>{reason(e.reason)}</span>
                        <b className={e.amount < 0 ? "spent" : ""}>{e.amount > 0 ? "+" : ""}{coins(e.amount)}</b>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          </div>
          <WardrobePanel />
        </>
      )}
    </>
  );
}

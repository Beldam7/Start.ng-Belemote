import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { User } from "./api";
import { AvatarFace } from "./Avatar";
import { styleFor } from "./character";
import { useFeature } from "./features/flags";

const CoinCounter = lazy(() => import("./features/wardrobe/CoinCounter"));

// The signed-in player's face in the top bar, with their name and the profile and sign-out
// options. Shared by the homepage and the docs page so the top bar is the same on both.
export default function AccountMenu({ user, isAdmin = false, onProfile, onFavorites, onSignOut }: {
  user: User; isAdmin?: boolean; onProfile: () => void; onFavorites: () => void; onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const friendsOn = useFeature("follows"); // Friends & follows (src/features/follows)
  const profilesOn = useFeature("profiles"); // Player pages (src/features/profiles)
  const wardrobeOn = useFeature("wardrobe"); // Coins, items and the shop (src/features/wardrobe)
  const ref = useRef<HTMLDivElement>(null);
  const style = user.character?.style ?? styleFor(user.id);
  const firstName = (user.name ?? user.email ?? "").split(/[ @]/)[0];

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="me" ref={ref}>
      {wardrobeOn && <Suspense fallback={null}><CoinCounter userId={user.id} /></Suspense>}
      <button className="me-button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Your account">
        <AvatarFace style={style} size={40} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <AvatarFace style={style} size={44} />
            <div>
              <strong>{user.character?.name ?? firstName}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          {profilesOn
            ? <a role="menuitem" href="/me" onClick={() => setOpen(false)}>Profile</a>
            : <button role="menuitem" onClick={() => { setOpen(false); onProfile(); }}>Profile</button>}
          <button role="menuitem" onClick={() => { setOpen(false); onFavorites(); }}>Favorites</button>
          {friendsOn && <a role="menuitem" href="/follows" onClick={() => setOpen(false)}>Friends</a>}
          {wardrobeOn && <a role="menuitem" href="/shop" onClick={() => setOpen(false)}>Shop</a>}
          {isAdmin && <a role="menuitem" href="/admin">Admin</a>}
          <button role="menuitem" onClick={() => { setOpen(false); onSignOut(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

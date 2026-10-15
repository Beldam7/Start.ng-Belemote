import { useEffect, useState } from "react";
import { CharacterStyle } from "./character";

/** The character's 3D face in a circle, for the top bar and menu. */
export function AvatarFace({ style, size = 36 }: { style: CharacterStyle; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    // three.js loads only when a face is first needed.
    import("./three/snapshot").then((m) => live && setSrc(m.faceImage(style)));
    return () => { live = false; };
  }, [style]);
  return (
    <span className="avatar-face" style={{ width: size, height: size }}>
      {src && <img src={src} alt="" width={size} height={size} />}
    </span>
  );
}

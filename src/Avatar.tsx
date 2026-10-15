import { CharacterStyle } from "./character";

const DARK = "#241a12";

// Head drawn in a 100x100 box, centred around (50, 55).
function Head({ s }: { s: CharacterStyle }) {
  const female = s.body === "female";
  return (
    <g>
      {/* hair behind the head */}
      {s.hair === "afro" && <circle cx="50" cy="46" r="35" fill={s.hairColor} />}
      {s.hair === "bun" && <circle cx="50" cy="17" r="12" fill={s.hairColor} />}
      {s.hair === "ponytail" && <ellipse cx="79" cy="52" rx="9" ry="22" transform="rotate(18 79 52)" fill={s.hairColor} />}
      {s.hair === "braids" && (
        <g fill={s.hairColor}>
          <rect x="21" y="44" width="11" height="46" rx="5.5" />
          <rect x="68" y="44" width="11" height="46" rx="5.5" />
        </g>
      )}
      {s.hair === "dreads" && (
        <g fill={s.hairColor}>
          {[22, 29, 65, 72].map((x) => <rect key={x} x={x} y="38" width="6" height="40" rx="3" />)}
        </g>
      )}
      <circle cx="26" cy="57" r="5" fill={s.skinColor} />
      <circle cx="74" cy="57" r="5" fill={s.skinColor} />
      <ellipse cx="50" cy="55" rx={female ? 23 : 25} ry="27" fill={s.skinColor} />
      {s.hair !== "bald" && (
        <path d="M25 54 Q24 25 50 25 Q76 25 75 54 Q67 37 50 37 Q33 37 25 54 Z" fill={s.hairColor} />
      )}
      {/* face */}
      {s.accessory === "beard" && <path d="M27 58 Q29 87 50 87 Q71 87 73 58 Q66 73 50 75 Q34 73 27 58 Z" fill={s.hairColor === "#b8b8b8" ? "#9a9a9a" : s.hairColor} />}
      <circle cx="41" cy="57" r="3.2" fill={DARK} />
      <circle cx="59" cy="57" r="3.2" fill={DARK} />
      {female ? (
        <g stroke={DARK} strokeWidth="1.6" strokeLinecap="round">
          <path d="M37 54 L35 52" />
          <path d="M63 54 L65 52" />
        </g>
      ) : (
        <g stroke={DARK} strokeWidth="2.6" strokeLinecap="round">
          <path d="M36 49 H45" />
          <path d="M55 49 H64" />
        </g>
      )}
      <path d="M43 68 Q50 74 57 68" stroke={female ? "#a23b45" : DARK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {s.accessory === "earrings" && (
        <g fill="#f5c542">
          <circle cx="26" cy="66" r="3" />
          <circle cx="74" cy="66" r="3" />
        </g>
      )}
      {s.accessory === "glasses" && (
        <g stroke={DARK} strokeWidth="2.4" fill="rgba(255,255,255,.25)">
          <circle cx="40" cy="57" r="7.5" />
          <circle cx="60" cy="57" r="7.5" />
          <path d="M47.5 57 H52.5" />
        </g>
      )}
      {/* hats */}
      {s.hat === "cap" && (
        <g fill={s.primaryColor}>
          <path d="M25 44 Q25 20 50 20 Q75 20 75 44 Z" />
          <rect x="44" y="40" width="42" height="7" rx="3.5" />
        </g>
      )}
      {s.hat === "beanie" && (
        <g fill={s.primaryColor}>
          <path d="M24 46 Q24 16 50 16 Q76 16 76 46 Z" />
          <rect x="22" y="40" width="56" height="10" rx="5" fill={s.secondaryColor} />
          <circle cx="50" cy="14" r="5" />
        </g>
      )}
      {s.hat === "tophat" && (
        <g fill={DARK}>
          <rect x="34" y="2" width="32" height="34" rx="3" />
          <rect x="22" y="33" width="56" height="7" rx="3.5" />
          <rect x="34" y="27" width="32" height="5" fill={s.primaryColor} />
        </g>
      )}
      {s.hat === "crown" && (
        <path d="M30 38 L30 18 L40 28 L50 14 L60 28 L70 18 L70 38 Z" fill="#f5c542" stroke="#c9971c" strokeWidth="2" strokeLinejoin="round" />
      )}
    </g>
  );
}

/** The character's face in a circle, for the top bar. */
export function AvatarFace({ style, size = 36 }: { style: CharacterStyle; size?: number }) {
  return (
    <svg className="avatar-face" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill="#d8fd71" />
      <g transform="translate(-6 0) scale(1.12)">
        <Head s={style} />
      </g>
    </svg>
  );
}

/** The whole character, for the creator. */
export function AvatarBody({ style: s, size = 220 }: { style: CharacterStyle; size?: number }) {
  const female = s.body === "female";
  // Female: narrower shoulders and a waist. Male: broader, straighter.
  const torso = female
    ? "M34 58 H66 Q69 58 68 64 L63 84 Q66 94 67 104 H33 Q34 94 37 84 L32 64 Q31 58 34 58 Z"
    : "M31 58 H69 Q72 58 72 64 V104 H28 V64 Q28 58 31 58 Z";
  const armL = female ? 23 : 18;
  const armR = female ? 66 : 71;
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 100 160" aria-hidden="true">
      <ellipse cx="50" cy="154" rx="26" ry="4" fill="rgba(0,0,0,.12)" />
      {s.accessory === "backpack" && <rect x="25" y="62" width="50" height="40" rx="8" fill="#7a5230" />}
      {/* legs and shoes */}
      <rect x="35" y="100" width="13" height="48" rx="5" fill={s.secondaryColor} />
      <rect x="52" y="100" width="13" height="48" rx="5" fill={s.secondaryColor} />
      <rect x="32" y="144" width="17" height="8" rx="4" fill={DARK} />
      <rect x="51" y="144" width="17" height="8" rx="4" fill={DARK} />
      {/* arms */}
      <rect x={armL} y="62" width="11" height="38" rx="5.5" fill={s.skinColor} />
      <rect x={armR} y="62" width="11" height="38" rx="5.5" fill={s.skinColor} />
      <rect x={armL} y="60" width="11" height="16" rx="5" fill={s.primaryColor} />
      <rect x={armR} y="60" width="11" height="16" rx="5" fill={s.primaryColor} />
      {/* neck and top */}
      <rect x="44" y="50" width="12" height="12" fill={s.skinColor} />
      <path d={torso} fill={s.primaryColor} />
      {s.accessory === "backpack" && (
        <g fill="#5a3a1f">
          <rect x="36" y="59" width="5" height="40" rx="2" />
          <rect x="59" y="59" width="5" height="40" rx="2" />
        </g>
      )}
      {s.accessory === "scarf" && (
        <g fill="#e2553f">
          <rect x="36" y="53" width="28" height="10" rx="5" />
          <rect x="55" y="58" width="8" height="22" rx="3" />
        </g>
      )}
      <g transform="translate(20 0) scale(.6)">
        <Head s={{ ...s, accessory: s.accessory === "scarf" || s.accessory === "backpack" ? "none" : s.accessory }} />
      </g>
    </svg>
  );
}

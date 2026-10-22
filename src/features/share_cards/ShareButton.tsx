// The Share button every feature uses (PRD B2):
//   import ShareButton from "../share_cards/ShareButton";
//   <ShareButton kind="challenge" id={code} />
// Phones get their share menu with the square card attached (WhatsApp, Instagram...); computers get X, WhatsApp and
// Copy link, where the pasted link shows the wide card as its preview. Shows nothing while share cards are off or there's
// nothing to share.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { analytics } from "../../analytics";
import { useFeature } from "../flags";
import { getShare, type ShareInfo, type ShareKind } from "./api";
import { withHandle } from "../../share";

const FEATURE = "share_cards";

const isPhone = () => typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches;

/** The square card as a file, for phones that can attach it to a share, else null. */
async function cardFile(info: ShareInfo): Promise<File | null> {
  if (typeof navigator.canShare !== "function") return null;
  try {
    const blob = await fetch(info.square_image_url).then((r) => (r.ok ? r.blob() : Promise.reject(new Error("no image"))));
    const file = new File([blob], "startng.jpg", { type: "image/jpeg" });
    return navigator.canShare({ files: [file] }) ? file : null;
  } catch {
    return null;
  }
}

type Props = {
  kind: ShareKind;
  id: string;
  label?: string; // the phone button's words
  intro?: ReactNode; // shown before the buttons, and only when there's something to share ("Your result on Tuesday")
  onShared?: () => void;
};

export default function ShareButton({ kind, id, label = "Share", intro, onShared }: Props) {
  const on = useFeature(FEATURE);
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false); // phones: the card picture is fetched (or couldn't be)
  const file = useRef<File | null>(null); // fetched ahead: a phone only shares straight after the tap
  const phone = isPhone();

  useEffect(() => {
    if (!on) return;
    let live = true;
    getShare(kind, id)
      .then(async (s) => {
        if (!live) return;
        setInfo(s);
        if (s && phone) file.current = await cardFile(s);
        if (live) setReady(true);
      })
      .catch(() => live && setInfo(null));
    return () => { live = false; };
  }, [on, kind, id, phone]);

  if (!on || !info) return null;
  const post = `${info.text} ${info.url}`;
  const shared = (method: "x" | "copy_link" | "whatsapp" | "share_menu") => {
    analytics.share("share_card", `${kind}/${id}`, method);
    onShared?.();
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(info!.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      shared("copy_link");
    } catch { /* nothing to copy to: the buttons beside it still work */ }
  }

  function shareOnPhone() {
    const data: ShareData = file.current ? { files: [file.current], text: post } : { title: info!.title, text: info!.text, url: info!.url };
    navigator.share(data)
      .then(() => shared("share_menu"))
      .catch((err) => { if (err?.name !== "AbortError") copy(); }); // cancelled: nothing to do
  }

  const buttons = phone ? <button type="button" onClick={shareOnPhone} disabled={!ready}>{label}</button> : (
    <div className="share-row">
      <a className="btn" href={`https://twitter.com/intent/tweet?${new URLSearchParams({ text: withHandle(info.text), url: info.url })}`}
        target="_blank" rel="noreferrer" onClick={() => shared("x")}>Post on X</a>
      <a className="btn ghost" href={`https://wa.me/?${new URLSearchParams({ text: post })}`} target="_blank" rel="noreferrer"
        onClick={() => shared("whatsapp")}>WhatsApp</a>
      <button type="button" className="ghost" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
    </div>
  );
  return intro ? <div className="share-block"><p>{intro}</p>{buttons}</div> : buttons;
}

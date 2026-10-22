import { useEffect, useState } from "react";
import ShareButton from "./ShareButton";
import { getShare, type ShareInfo, type ShareKind } from "./api";

/** /share-preview?kind=<kind>&id=<id>, only in `npm run dev`: a card in both sizes and the Share button, so a feature's
 *  owner can check how their kind looks before anyone shares it. */
export default function PreviewPage() {
  const query = new URLSearchParams(location.search);
  const kind = (query.get("kind") ?? "tournament_result") as ShareKind;
  const id = query.get("id") ?? "1-1";
  const [info, setInfo] = useState<ShareInfo | null | undefined>(undefined);

  useEffect(() => { getShare(kind, id).then(setInfo).catch(() => setInfo(null)); }, [kind, id]);

  return (
    <section className="container share-preview">
      <h1>Share card preview</h1>
      <p className="note">Only in development. Change <code>?kind=</code> and <code>&amp;id=</code> in the address to see another card.</p>
      {info === null && <p className="note">Nothing to share at {kind}/{id}.</p>}
      {info && (
        <>
          <p><b>{info.title}</b> · <a href={info.url}>{info.url}</a></p>
          <p className="note">{info.text}</p>
          <ShareButton kind={kind} id={id} />
          <h2>Wide (X, link previews)</h2>
          <img src={info.image_url} alt={info.title} width={1200} height={630} />
          <h2>Square (WhatsApp, Instagram)</h2>
          <img src={info.square_image_url} alt={info.title} width={1080} height={1080} />
        </>
      )}
    </section>
  );
}

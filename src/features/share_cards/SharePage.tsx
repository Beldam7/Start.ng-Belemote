import { useEffect, useState } from "react";
import type { PageProps } from "../registry";
import { PAGES, setSeo } from "../../seo";
import { getShare, type ShareKind } from "./api";

/** start.ng/s/<kind>/<id>: a shared card. Chat apps read its preview tags (the API writes them, see nginx.conf);
 *  people are sent straight on to what was shared. */
export default function SharePage({ params }: PageProps) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getShare(params.kind as ShareKind, params.id)
      .then((s) => (s ? location.replace(s.path) : setMissing(true)))
      .catch(() => setMissing(true));
  }, [params.kind, params.id]);
  useEffect(() => { if (missing) setSeo(PAGES.notFound); }, [missing]);

  if (!missing) return <section className="container"><p className="note">Opening…</p></section>;
  return (
    <section className="container">
      <h1>Nothing here</h1>
      <p className="note">This link has expired or was removed.</p>
      <p><a className="btn" href="/games">Play games on start.ng</a></p>
    </section>
  );
}

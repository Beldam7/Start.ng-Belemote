import { useEffect } from "react";
import type { PageProps } from "../registry";
import { setSeo } from "../../seo";

export default function ExamplePage({ user, onSignIn, params }: PageProps) {
  useEffect(() => setSeo({ title: "Example · start.ng", description: "An example feature page.", path: "/example" }), []);
  return (
    <section className="container">
      <h1>Example{params.id ? ` ${params.id}` : ""}</h1>
      {user ? <p>Hi {user.name ?? user.email}</p> : <button type="button" onClick={onSignIn}>Sign in</button>}
    </section>
  );
}

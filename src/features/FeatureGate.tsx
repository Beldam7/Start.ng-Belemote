import { useEffect, useState, type ReactNode } from "react";
import { loadFeatures } from "./flags";

/** Shows its children only while the feature's flag is on; otherwise `off` (a not-found page). Nothing while loading. */
export default function FeatureGate({ feature, off, children }: { feature: string; off: ReactNode; children: ReactNode }) {
  const [state, setState] = useState<"loading" | "on" | "off">("loading");
  useEffect(() => {
    loadFeatures().then((f) => setState(f.has("*") || f.has(feature.toLowerCase()) ? "on" : "off"));
  }, [feature]);
  return state === "loading" ? null : state === "on" ? <>{children}</> : <>{off}</>;
}

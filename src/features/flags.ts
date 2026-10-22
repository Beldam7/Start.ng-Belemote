// Feature flags from the API (GET /features). A feature's pages, card parts, admin tabs and profile sections are
// hidden until its flag is on. Fetched once per page load.
import { useEffect, useState } from "react";
import { getFeatures } from "../api";

let cache: Promise<Set<string>> | null = null;

export function loadFeatures(): Promise<Set<string>> {
  cache ??= getFeatures().then((list) => new Set(list)).catch(() => new Set<string>());
  return cache;
}

const on = (flags: Set<string>, name: string | null) => name === null || flags.has("*") || flags.has(name.toLowerCase());

/** Whether a feature is on. false until the list has loaded (features ship dark). null: always on. */
export function useFeature(name: string | null): boolean {
  return useFeatures()(name);
}

/** A checker for many features at once: const isOn = useFeatures(); isOn("wardrobe"). */
export function useFeatures(): (name: string | null) => boolean {
  const [flags, setFlags] = useState<Set<string> | null>(null);
  useEffect(() => {
    let live = true;
    loadFeatures().then((f) => live && setFlags(f));
    return () => { live = false; };
  }, []);
  return (name) => (flags ? on(flags, name) : name === null);
}

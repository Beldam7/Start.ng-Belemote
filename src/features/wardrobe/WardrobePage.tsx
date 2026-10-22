import { useEffect } from "react";

/** The wardrobe is a tab of the shop now: old /wardrobe links land there. */
export default function WardrobePage() {
  useEffect(() => { location.replace("/shop#wardrobe"); }, []);
  return null;
}

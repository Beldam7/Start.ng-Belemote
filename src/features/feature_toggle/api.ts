// The admin Features tab's API calls (startng-be app/routers/feature_switches.py). Super admins only.
import { call, send } from "../../api";

export type FeatureRow = {
  name: string; description: string; enabled: boolean;
  source: "admin" | "server"; // admin: switched in this tab; server: the FEATURES setting
  server_on: boolean; caution: string | null; changed_by: string | null; changed_at: string | null;
};

const token = () => localStorage.getItem("token");

export const listFeatures = () => call<FeatureRow[]>(token(), "/admin/features");
/** enabled: true or false to switch it here; null to go back to the server setting. Resolves to the whole list. */
export const switchFeature = (name: string, enabled: boolean | null) =>
  call<FeatureRow[]>(token(), `/admin/features/${encodeURIComponent(name)}`, send("PUT", { enabled }));

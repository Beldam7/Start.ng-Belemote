import { call, send } from "../../api";

export type Status = "new" | "confirmed" | "duplicate" | "not_a_bug" | "fixed";
export type MyReport = {
  id: number; what: string; page: string | null; status: Status; admin_note: string | null; coins: number;
  created_at: string; decided_at: string | null;
};
export type AdminReport = MyReport & {
  reporter: string; reporter_email: string; browser: string | null; duplicate_of: number | null; decided_by: string | null;
  similar: { id: number; what: string; status: Status }[];
};
export type Queue = { counts: Partial<Record<Status, number>>; reward: number; per_day: number; reports: AdminReport[] };

const t = () => localStorage.getItem("token");
export const sendReport = (what: string, page: string, browser: string) =>
  call<MyReport>(t(), "/support/reports", send("POST", { what, page, browser }));
export const myReports = () => call<MyReport[]>(t(), "/support/reports/mine");
export const queue = (status?: Status) => call<Queue>(t(), `/admin/support/reports${status ? `?status=${status}` : ""}`);
export const decide = (id: number, status: Status, note?: string | null, duplicateOf?: number) =>
  call<AdminReport>(t(), `/admin/support/reports/${id}`, send("POST", { status, note: note ?? null, duplicate_of: duplicateOf ?? null }));

export const STATUS_LABEL: Record<Status, string> = {
  new: "waiting for a look", confirmed: "real bug, thanks!", duplicate: "already reported", not_a_bug: "not a bug", fixed: "fixed",
};

/** "Chrome 130 on Windows": enough to reproduce a problem, nothing more. */
export function browserName(ua = navigator.userAgent): string {
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "another system";
  const m = ua.match(/(Edg|OPR|SamsungBrowser|Firefox|Chrome|Version)\/(\d+)/);
  const names: Record<string, string> = { Edg: "Edge", OPR: "Opera", SamsungBrowser: "Samsung Internet", Version: "Safari" };
  return m ? `${names[m[1]] ?? m[1]} ${m[2]} on ${os}` : `A browser on ${os}`;
}

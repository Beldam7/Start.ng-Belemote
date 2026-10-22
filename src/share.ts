/** start.ng's account on X. Every post a Share button opens mentions it. */
export const X_HANDLE = "@playonstartng";

/** The post text with start.ng's handle on the end (once). */
export const withHandle = (text: string) => (text.toLowerCase().includes(X_HANDLE) ? text : `${text} ${X_HANDLE}`);

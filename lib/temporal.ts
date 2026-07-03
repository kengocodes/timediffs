/**
 * Single import point for the Temporal API.
 *
 * Chrome, Edge, Firefox, and Node ship Temporal natively, but Safari does not
 * yet (mid-2026). Importing the polyfill's named export everywhere gives
 * identical, spec-compliant behavior across every runtime (browser, SSR, and
 * tests). Once Safari ships Temporal, delete this file and switch imports to
 * the global `Temporal` object.
 */
export { Temporal } from "temporal-polyfill";

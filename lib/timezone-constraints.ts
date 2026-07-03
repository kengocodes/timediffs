/**
 * Maximum number of timezones allowed to prevent DoS attacks and performance issues.
 * This limit protects against:
 * - Browser performance degradation
 * - Memory exhaustion
 * - UI rendering problems
 *
 * Lives in its own module (no nuqs import) so both client code and server
 * route handlers can share it.
 */
export const MAX_TIMEZONES = 8;

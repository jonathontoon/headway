/**
 * Build metadata available in the app and tests.
 *
 * @remarks
 * The Vite build replaces these globals in production. The fallback values
 * keep Vitest and other non-Vite environments from throwing at runtime.
 */
export const APP_VERSION =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "3.1.0";

/**
 * Build time shown by the `version` command.
 *
 * @remarks
 * The Vite build replaces this global in production. The fallback keeps
 * non-Vite environments from throwing at runtime.
 */
export const APP_DEPLOYED_AT =
  typeof __APP_DEPLOYED_AT__ === "string" ? __APP_DEPLOYED_AT__ : "local build";

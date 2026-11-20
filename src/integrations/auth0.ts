import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Next.js server-only Auth0 v4 boundary for the production migration.
 * The current buildless classroom client never imports this module.
 */
export const auth0 = new Auth0Client();

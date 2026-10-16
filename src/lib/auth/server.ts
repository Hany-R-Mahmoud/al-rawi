import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Managed Neon Auth: provider credentials belong to Neon, never to browser code.
 * Cookie secret is distinct from the Google Web OAuth Client Secret.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

import "server-only";
import { headers } from "next/headers";
import { appAuth } from "./app";

/**
 * App-hosted Better Auth: provider credentials belong to this server, never to browser code.
 * Cookie secret is distinct from the Google Web OAuth Client Secret.
 * Existing Neon Auth tables retain the account and backup ownership IDs.
 */
// Google sessions now use this app's domain and the existing Neon user IDs.
export const auth = {
  async getSession() {
    const data = await appAuth().api.getSession({ headers: await headers() });
    return { data, error: null };
  },
};

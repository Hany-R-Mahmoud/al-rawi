import { auth } from "@/lib/auth/server";

/**
 * Public, guest-first reader routes must NOT be guarded by an auth redirect.
 * This matcher is only for completing Neon OAuth's session-verifier exchange.
 * Protected data API routes verify their session independently.
 */
export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/auth/callback"],
};

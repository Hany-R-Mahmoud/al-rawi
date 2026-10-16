"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Web-only, same-origin client. Never launch this OAuth flow inside Android WebView. */
export const authClient = createAuthClient();

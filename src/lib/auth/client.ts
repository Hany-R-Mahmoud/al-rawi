"use client";

import { createAuthClient } from "better-auth/react";

/** Web-only, same-origin client. Never launch this OAuth flow inside Android WebView. */
export const authClient = createAuthClient();

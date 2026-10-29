import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createAppAuth } from "./app";

const connectionString = process.env.AUTH_TEST_DATABASE_URL;

test("app OAuth callback, trusted origins, and existing session ownership", { skip: !connectionString }, async () => {
  assert.ok(connectionString);
  assert.ok(process.env.DATABASE_URL);
  assert.notEqual(new URL(connectionString).hostname, new URL(process.env.DATABASE_URL).hostname);
  const pool = new Pool({ connectionString, max: 3 });
  const origin = "https://al-rawi-rss.vercel.app";
  const secret = randomBytes(48).toString("base64url");
  const auth = createAppAuth(pool, {
    baseURL: origin, secret,
    googleClientId: "isolated-test-client", googleClientSecret: "isolated-test-secret",
  });
  const signIn = (originHeader = origin) => auth.handler(new Request(`${origin}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { origin: originHeader, "content-type": "application/json", cookie: "oauth_validation=1" },
    body: JSON.stringify({ provider: "google", callbackURL: `${origin}/auth/callback`, disableRedirect: true }),
  }));
  try {
    const start = await signIn();
    assert.equal(start.status, 200);
    const authorization = new URL((await start.json()).url);
    assert.equal(authorization.origin, "https://accounts.google.com");
    assert.equal(authorization.searchParams.get("redirect_uri"), `${origin}/api/auth/callback/google`);
    assert.ok(authorization.searchParams.get("state"));
    assert.ok(authorization.searchParams.get("code_challenge"));
    assert.equal((await signIn("https://untrusted.example")).status, 403);

    const userId = randomUUID();
    const sessionId = randomUUID();
    const token = randomBytes(32).toString("base64url");
    await pool.query('INSERT INTO neon_auth."user" (id,name,email,"emailVerified") VALUES ($1,$2,$3,true)', [
      userId, "OAuth validation fixture", `${userId}@example.invalid`,
    ]);
    await pool.query('INSERT INTO neon_auth.session (id,token,"userId","expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'5 minutes\',now())', [sessionId, token, userId]);
    const signature = createHmac("sha256", secret).update(token).digest("base64");
    const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
    const session = (value = cookie) => auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { cookie: value } }));
    assert.equal((await (await session()).json()).user.id, userId);
    assert.equal(await (await session(`${cookie}forged`)).json(), null);
    await pool.query('UPDATE neon_auth.session SET "expiresAt"=now()-interval \'1 minute\' WHERE id=$1', [sessionId]);
    assert.equal(await (await session()).json(), null);
  } finally {
    await pool.end();
  }
});

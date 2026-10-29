import { appAuth } from "@/lib/auth/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request) {
  const response = await appAuth().handler(request);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export { handler as GET, handler as POST };

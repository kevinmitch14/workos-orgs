import { type NextRequest, NextResponse } from "next/server";
import { orgSlugToId, workosClient } from "@/app/lib/workos";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  headers();
  const tenantParam = request.nextUrl.searchParams.get("tenant") as string;

  const id = orgSlugToId.get(tenantParam);
  console.log({ id, tenantParam });
  const authorizationUrl = workosClient.userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: "http://auth.localhost:3000/api/auth/callback",
    clientId: process.env.WORKOS_CLIENT_ID!,
    organizationId: orgSlugToId.get(tenantParam),
  });

  console.log(`Redirecting to getAuthorizationUrl...`, authorizationUrl);
  return NextResponse.redirect(authorizationUrl);
}

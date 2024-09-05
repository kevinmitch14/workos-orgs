import { NextResponse, type NextRequest } from "next/server";
import { sealData } from "iron-session";
import { orgIdToSlug, SealData, workosClient } from "@/app/lib/workos";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  headers();
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json("No code", { status: 400 });
  }

  const { user, accessToken, refreshToken, impersonator, organizationId } =
    await workosClient.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID!,
    });

  if (!organizationId) {
    return NextResponse.json("User not part of any organization", {
      status: 403,
    });
  }

  console.log("Organization ID from authenticateWithCode: ", organizationId);

  const sealFields: SealData = {
    accessToken,
    refreshToken,
    user,
    impersonator,
    organizationId,
  };

  const encryptedSession = await sealData(sealFields, {
    password: process.env.WORKOS_COOKIE_PASSWORD!,
  });

  const tenantSlug = orgIdToSlug.get(organizationId);

  console.log({ tenantSlug });
  return NextResponse.redirect(
    `http://${tenantSlug}.localhost:3000/api/auth/recover?state=${encryptedSession}&tenant=${tenantSlug}`
  );
}

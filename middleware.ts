import { type NextRequest, NextResponse } from "next/server";
import { sealData } from "iron-session";
import {
  getSessionFromCookie,
  getSubdomain,
  orgIdToSlug,
  SealData,
  verifyAccessToken,
  WORK_OS_COOKIE_NAME,
  workosClient,
} from "./app/lib/workos";

export async function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const subdomain = getSubdomain(host);
  console.log({ subdomain });
  const url = request.nextUrl.clone();
  const path = url.pathname;

  const workosCookie = request.cookies.get("wos-session");
  const session = await getSessionFromCookie(workosCookie?.value);

  if (!session) {
    console.log("NO SESSION");
    return NextResponse.redirect(
      `http://auth.localhost:3000/api/auth?tenant=${subdomain}`
    );
  }

  if (subdomain !== orgIdToSlug.get(session.organizationId)) {
    console.log("Subdomain and session don't match");
  }

  request.nextUrl.pathname = `/${subdomain}/${path}`;
  const response = NextResponse.rewrite(request.nextUrl);

  const hasValidSession = await verifyAccessToken(session.accessToken);

  if (!hasValidSession) {
    try {
      // If the session is invalid (access token has expired) attempt to re-authenticate with the refresh token
      const { accessToken, refreshToken } =
        await workosClient.userManagement.authenticateWithRefreshToken({
          clientId: process.env.WORKOS_CLIENT_ID!,
          refreshToken: session.refreshToken,
        });

      const sealFields: SealData = {
        accessToken,
        refreshToken,
        user: session.user,
        impersonator: session.impersonator,
        organizationId: session.organizationId,
      };
      // Update the session with the new access and refresh tokens
      const encryptedSession = await sealData(
        { ...sealFields },
        { password: process.env.WORKOS_COOKIE_PASSWORD! }
      );

      response.cookies.set({
        name: WORK_OS_COOKIE_NAME,
        value: encryptedSession,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
    } catch (e) {
      console.error("Failed to refresh access token");
      // Failed to refresh access token, redirect user to login page after deleting the cookie
      response.cookies.delete(WORK_OS_COOKIE_NAME);
      return NextResponse.redirect(`http://auth.localhost:3000/api/auth`);
    }
  }

  return response;
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

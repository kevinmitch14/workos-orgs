import { Impersonator, User, WorkOS } from "@workos-inc/node";
import { unsealData } from "iron-session";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const workosClient = new WorkOS(process.env.WORKOS_API_KEY);

export async function getSession() {
  if (typeof window !== "undefined") {
    throw new Error("getSession can not be used on the client");
  }
  const workosCookie = cookies().get(WORK_OS_COOKIE_NAME);
  const session = await getSessionFromCookie(workosCookie?.value);
  return session;
}

export type SealData = {
  accessToken: string;
  refreshToken: string;
  user: User;
  impersonator: Impersonator | undefined;
  organizationId: string;
};

export const WORK_OS_COOKIE_NAME = "wos-session" as const;

const JWKS = createRemoteJWKSet(
  new URL(workosClient.userManagement.getJwksUrl(process.env.WORKOS_CLIENT_ID!))
);

export function getSubdomain(host: string | null | undefined) {
  if (typeof host !== "string" || host.trim() === "") return "";
  return host.replace(`.localhost:${process.env.PORT}`, "");
}

export async function getSessionFromCookie(workosCookie: string | undefined) {
  if (!workosCookie) return;

  return unsealData<SealData>(workosCookie, {
    password: process.env.WORKOS_COOKIE_PASSWORD!,
  });
}

export async function verifyAccessToken(accessToken: string) {
  try {
    await jwtVerify(accessToken, JWKS);
    return true;
  } catch (e) {
    console.warn("Failed to verify session:", e);
    return false;
  }
}

export const orgSlugToId = new Map([
  //   ["demo", "org_XXX"],
  //   ["mock", "org_XXX"],
]);
export const orgIdToSlug = new Map([
  //   ["org_XXX", "demo"],
  //   ["org_XXX", "mock"],
]);

if (orgSlugToId.size === 0 || orgIdToSlug.size === 0) {
  throw new Error("Set up a map for your orgs");
}

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookie, WORK_OS_COOKIE_NAME } from "@/app/lib/workos";

export async function GET(request: NextRequest) {
  headers();
  const state = request.nextUrl.searchParams.get("state");
  const tenant = request.nextUrl.searchParams.get("tenant");
  if (!state) {
    return NextResponse.json("Error recovering user session", { status: 500 });
  }

  const session = await getSessionFromCookie(state);

  if (!session) {
    return NextResponse.json("No session found", { status: 401 });
  }

  cookies().set(WORK_OS_COOKIE_NAME, state, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  redirect(`http://${tenant}.localhost:3000`);
}

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = { userId?: string };

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "mvp_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore as any, sessionOptions);
}
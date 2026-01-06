import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  session.destroy();

  const url = new URL("/", req.url); // тот же домен/протокол
  return NextResponse.redirect(url);
}
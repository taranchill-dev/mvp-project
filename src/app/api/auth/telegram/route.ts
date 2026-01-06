import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

function verifyTelegram(data: any, botToken: string) {
  const { hash, ...rest } = data;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");

  return hmac === hash;
}

export async function POST(req: Request) {
  const body = await req.json();

  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  if (!verifyTelegram(body, botToken)) {
    return NextResponse.json({ error: "invalid telegram signature" }, { status: 401 });
  }

  const telegram_id = Number(body.id);

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("telegram_id", telegram_id)
    .maybeSingle();

  let userId = existing?.id;

  if (!userId) {
    const { data: inserted, error } = await supabaseAdmin
      .from("users")
      .insert({
        telegram_id,
        username: body.username ?? null,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        photo_url: body.photo_url ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    userId = inserted.id;
  }

  const session = await getSession();
  session.userId = userId;
  await session.save();

  return NextResponse.json({ ok: true });
}
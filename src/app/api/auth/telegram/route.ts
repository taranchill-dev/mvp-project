import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const runtime = "nodejs"; // чтобы точно не уехало в edge

function verifyTelegram(data: Record<string, any>, botToken: string) {
  const { hash, ...rest } = data;
  if (!hash) return false;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");

  // safer compare
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(String(hash)));
}

async function handleTelegramPayload(payload: any) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  if (!botToken) return NextResponse.json({ error: "missing TELEGRAM_BOT_TOKEN" }, { status: 500 });

  if (!verifyTelegram(payload, botToken)) {
    return NextResponse.json({ error: "invalid telegram signature" }, { status: 401 });
  }

  // анти-replay (рекомендую)
  const authDate = Number(payload.auth_date || 0);
  if (!authDate || (Date.now() / 1000 - authDate) > 60 * 5) {
    return NextResponse.json({ error: "auth_date expired" }, { status: 401 });
  }

  const telegram_id = String(payload.id); // безопаснее чем Number()

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
        username: payload.username ?? null,
        first_name: payload.first_name ?? null,
        last_name: payload.last_name ?? null,
        photo_url: payload.photo_url ?? null,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    userId = inserted.id;
  }

  const session = await getSession();
  session.userId = userId;
  await session.save();

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return handleTelegramPayload(body);
}

export async function GET(req: NextRequest) {
  const payload = Object.fromEntries(req.nextUrl.searchParams.entries());
  // если придут числа строками — ок, мы их как строки и используем
  return handleTelegramPayload(payload);
}
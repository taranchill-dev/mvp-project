"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!bot || !ref.current) return;

    // если скрипт уже есть — не добавляем второй раз
    if (document.getElementById("telegram-login-script")) return;

    const script = document.createElement("script");
    script.id = "telegram-login-script";
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;

    script.setAttribute("data-telegram-login", bot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    // глобальный коллбек для виджета
    (window as any).onTelegramAuth = async (user: any) => {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (res.ok) location.href = "/";
      else alert("Telegram auth failed");
    };

    ref.current.innerHTML = "";
    ref.current.appendChild(script);
  }, []);

  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in with Telegram to continue.
          </p>

          {!bot ? (
            <p className="text-sm text-red-500">
              NEXT_PUBLIC_TELEGRAM_BOT_USERNAME missing in .env.local (restart dev server)
            </p>
          ) : (
            <div ref={ref} className="flex justify-center" />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
import { cookies } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await getSession();

  if (!session.userId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>You are not logged in</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>✅ Logged in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            userId: <span className="font-mono">{session.userId}</span>
          </div>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="secondary" className="w-full">
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
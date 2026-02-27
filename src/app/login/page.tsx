"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const next = searchParams.get("next") ?? "/dashboard";
  const registerHref = `/register?next=${encodeURIComponent(next)}`;
  const isRegistered = searchParams.get("registered") === "1";

  return (
    <section className="mx-auto max-w-md">
      <Card className="border-amber-200/80 bg-amber-50/45 dark:border-amber-900/70 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your temple booking dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRegistered ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200">
              Account created successfully. Please sign in.
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              await signIn("google", { callbackUrl: next });
            }}
          >
            Continue with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-amber-200 dark:border-amber-900/70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-amber-50 px-2 text-amber-950/85 dark:bg-amber-950 dark:text-amber-50/85">or</span>
            </div>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
              });
              if (result?.error) {
                setError("Invalid credentials");
                return;
              }
              router.push(next);
              router.refresh();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-amber-950/90 dark:text-amber-50/90">
            New here?{" "}
            <Link href={registerHref} className="font-medium underline decoration-amber-500/60 underline-offset-4">
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterResponse = {
  ok: boolean;
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const loginHref = `/login?next=${encodeURIComponent(next)}`;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="mx-auto max-w-md">
      <Card className="border-amber-200/80 bg-amber-50/45 dark:border-amber-900/70 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join the temple community and book programs online.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");

              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
              }

              setIsSubmitting(true);

              try {
                const response = await fetch("/api/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, email, password }),
                });
                const payload = (await response.json()) as RegisterResponse;

                if (!response.ok || !payload.ok) {
                  setError(payload.message ?? "Unable to create account.");
                  return;
                }

                const loginResult = await signIn("credentials", {
                  email,
                  password,
                  redirect: false,
                });

                if (loginResult?.error) {
                  router.push(`${loginHref}&registered=1`);
                  return;
                }

                router.push(next);
                router.refresh();
              } catch {
                setError("Something went wrong. Please try again.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-amber-950/90 dark:text-amber-50/90">
            Already have an account?{" "}
            <Link href={loginHref} className="font-medium underline decoration-amber-500/60 underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

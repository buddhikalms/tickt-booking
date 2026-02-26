import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncOrderFromStripeSession } from "@/lib/order-service";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const syncResult =
    sessionId
      ? await syncOrderFromStripeSession(sessionId, "success").catch(() => ({
          ok: false,
          paid: false,
          status: null,
          message: "Could not verify payment right now. Please refresh in a minute.",
        }))
      : null;

  return (
    <section className="mx-auto max-w-xl">
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="text-2xl font-semibold">Payment Successful</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Your purchase has been confirmed. We are issuing your tickets and sending the PDF by email.
          </p>
          {syncResult ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {syncResult.message}
            </p>
          ) : null}
          {sessionId ? <p className="text-xs text-slate-500">Stripe Session: {sessionId}</p> : null}
          <Button asChild>
            <Link href="/">Back to events</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

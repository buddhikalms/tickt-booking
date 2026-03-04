import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncOrderFromOrderId, syncOrderFromStripeSession } from "@/lib/order-service";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; order_id?: string; provider?: string }>;
}) {
  const { session_id: sessionId, order_id: orderId } = await searchParams;
  const syncResult =
    sessionId
      ? await syncOrderFromStripeSession(sessionId, "success").catch(() => ({
          ok: false,
          paid: false,
          status: null,
          message: "Could not verify payment right now. Please refresh in a minute.",
        }))
      : orderId
        ? await syncOrderFromOrderId(orderId, "success").catch(() => ({
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
          <p className="theme-muted-text">
            Your purchase has been confirmed. We are issuing your tickets and sending the PDF by email.
          </p>
          {syncResult ? (
            <p className="theme-panel theme-soft-text rounded-md border p-3 text-sm">
              {syncResult.message}
            </p>
          ) : null}
          {sessionId ? <p className="theme-muted-text text-xs">Checkout Session: {sessionId}</p> : null}
          {orderId ? <p className="theme-muted-text text-xs">Order: {orderId}</p> : null}
          <Button asChild>
            <Link href="/">Back to events</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

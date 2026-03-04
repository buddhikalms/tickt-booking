import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Clock3, Ticket, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { syncOrderFromStoredCheckoutReference } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/utils";

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?next=/dashboard");
  }

  const where = session.user.id ? { OR: [{ userId: session.user.id }, { email: session.user.email }] } : { email: session.user.email };

  const pendingOrders = await prisma.order.findMany({
    where: {
      ...where,
      status: "PENDING",
      stripeSessionId: { not: null },
    },
    select: { stripeSessionId: true },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  for (const order of pendingOrders) {
    if (order.stripeSessionId) {
      await syncOrderFromStoredCheckoutReference(order.stripeSessionId, "dashboard").catch(() => null);
    }
  }

  const [orders, tickets, paidAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 10,
    }),
    prisma.ticket.findMany({
      where: {
        order: where,
      },
      include: { event: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.aggregate({
      where: { ...where, status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  const upcoming = tickets.filter((ticket) => ticket.event.startsAt >= new Date() && ticket.status === "VALID").length;
  const used = tickets.filter((ticket) => ticket.status === "USED").length;

  const stats = [
    { label: "Total Spent", value: formatCurrency(paidAgg._sum.totalCents ?? 0, DEFAULT_CURRENCY), icon: Wallet },
    { label: "Tickets", value: `${tickets.length}`, icon: Ticket },
    { label: "Upcoming", value: `${upcoming}`, icon: Clock3 },
    { label: "Used", value: `${used}`, icon: CheckCircle2 },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-cyan-200/60 bg-gradient-to-r from-cyan-50 to-sky-100 p-6 shadow-lg dark:border-cyan-900/30 dark:from-cyan-950/20 dark:to-sky-950/20">
        <h1 className="text-2xl font-semibold">My Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage your bookings, upcoming events, and ticket access in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
                <Icon className="h-5 w-5 text-slate-500" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>Recent tickets and validation links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tickets found yet.</p>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{ticket.event.title}</p>
                    <Badge
                      variant={
                        ticket.status === "VALID" ? "success" : ticket.status === "USED" ? "warning" : "destructive"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {ticket.ticketType.name} • {format(ticket.event.startsAt, "PPP p")}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/t/${ticket.code}`}>View Ticket</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>Latest transactions and status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Badge variant={order.status === "PAID" ? "success" : "secondary"}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalCents, order.currency)}</TableCell>
                      <TableCell>{format(order.createdAt, "PP p")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Activity, PoundSterling, ShoppingCart, TicketCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const date30d = new Date();
  date30d.setDate(date30d.getDate() - 30);

  const [orders, tickets, checkedIn, revenueAgg, recentOrders, ticketByEvent, paidOrders30d] = await Promise.all([
    prisma.order.count(),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "USED" } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: "PAID" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true },
    }),
    prisma.ticket.groupBy({
      by: ["eventId"],
      _count: { _all: true },
      orderBy: { _count: { eventId: "desc" } },
      take: 5,
    }),
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: date30d } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
  ]);

  const eventMap = new Map(
    (
      await prisma.event.findMany({
        where: { id: { in: ticketByEvent.map((row) => row.eventId) } },
        select: { id: true, title: true },
      })
    ).map((event) => [event.id, event.title]),
  );

  const cards = [
    { label: "Revenue", value: formatCurrency(revenueAgg._sum.totalCents ?? 0, DEFAULT_CURRENCY), icon: PoundSterling },
    { label: "Orders", value: orders.toString(), icon: ShoppingCart },
    { label: "Tickets Issued", value: tickets.toString(), icon: TicketCheck },
    { label: "Check-ins", value: checkedIn.toString(), icon: Activity },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-cyan-100 p-6 shadow-lg dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-cyan-950/20">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Live business overview for bookings, sales, and check-in performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
                <Icon className="h-5 w-5 text-slate-500" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">Most recent transactions</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="max-w-[200px] truncate">{order.email}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "PAID" ? "success" : "secondary"}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalCents, order.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Performance (Last 30 days)</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">Short-term momentum snapshot</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Paid Orders</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-1 text-2xl font-semibold">{paidOrders30d._count._all}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Revenue: {formatCurrency(paidOrders30d._sum.totalCents ?? 0, DEFAULT_CURRENCY)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Top Events by Tickets</p>
              {ticketByEvent.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No ticket activity yet.</p>
              ) : (
                ticketByEvent.map((row) => (
                  <div key={row.eventId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                    <p className="text-sm">{eventMap.get(row.eventId) ?? row.eventId}</p>
                    <Badge variant="secondary">{row._count._all} sold</Badge>
                  </div>
                ))
              )}
            </div>
            </CardContent>
        </Card>
      </div>
    </section>
  );
}

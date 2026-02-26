import { format } from "date-fns";
import { OrderStatus } from "@prisma/client";
import { resendOrderTicketsAction, syncOrderPaymentAction, updateOrderStatusAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const orders = await prisma.order.findMany({
    where: q ? { email: { contains: q } } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <form className="max-w-sm">
        <Input name="q" placeholder="Search by buyer email" defaultValue={q ?? ""} />
      </form>
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Stripe Session</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "PAID" ? "success" : "secondary"}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalCents, order.currency)}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{order.stripeSessionId ?? "-"}</TableCell>
                  <TableCell>{format(order.createdAt, "PP p")}</TableCell>
                  <TableCell className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {order.status === "PENDING" && order.stripeSessionId ? (
                        <form action={syncOrderPaymentAction.bind(null, order.id)}>
                          <Button size="sm" variant="outline" type="submit">
                            Sync Stripe
                          </Button>
                        </form>
                      ) : null}
                      {order.status === "PAID" ? (
                        <form action={resendOrderTicketsAction.bind(null, order.id)}>
                          <Button size="sm" variant="outline" type="submit">
                            Resend Email
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.status !== "CANCELLED" ? (
                        <form action={updateOrderStatusAction.bind(null, order.id, OrderStatus.CANCELLED)}>
                          <Button size="sm" variant="destructive" type="submit">
                            Cancel
                          </Button>
                        </form>
                      ) : null}
                      {order.status === "PAID" ? (
                        <form action={updateOrderStatusAction.bind(null, order.id, OrderStatus.REFUNDED)}>
                          <Button size="sm" variant="outline" type="submit">
                            Mark Refunded
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

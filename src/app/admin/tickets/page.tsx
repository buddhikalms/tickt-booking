import Link from "next/link";
import { format } from "date-fns";
import { cancelTicketAction, resendOrderTicketsAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; status?: string; q?: string }>;
}) {
  const { eventId, status, q } = await searchParams;
  const [events, tickets] = await Promise.all([
    prisma.event.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.ticket.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(status ? { status: status as "VALID" | "USED" | "CANCELLED" } : {}),
        ...(q ? { code: { contains: q } } : {}),
      },
      include: {
        event: true,
        ticketType: true,
        order: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <form className="grid gap-2 md:grid-cols-4">
        <select name="eventId" defaultValue={eventId ?? ""} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <option value="">All events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <option value="">All status</option>
          <option value="VALID">VALID</option>
          <option value="USED">USED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <Input name="q" defaultValue={q ?? ""} placeholder="Search code" />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>Issued Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Link href={`/t/${ticket.code}`} className="underline">
                      {ticket.code}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.event.title}</TableCell>
                  <TableCell>{ticket.ticketType.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.status === "VALID" ? "success" : ticket.status === "USED" ? "warning" : "destructive"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.checkedInAt ? format(ticket.checkedInAt, "PP p") : "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <form action={resendOrderTicketsAction.bind(null, ticket.orderId)}>
                      <Button size="sm" variant="outline">
                        Resend
                      </Button>
                    </form>
                    {ticket.status !== "CANCELLED" ? (
                      <form action={cancelTicketAction.bind(null, ticket.id)}>
                        <Button size="sm" variant="destructive">
                          Cancel
                        </Button>
                      </form>
                    ) : null}
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

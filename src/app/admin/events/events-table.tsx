"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EventRow = {
  id: string;
  title: string;
  venue: string;
  startsAt: string;
  isPublished: boolean;
};

const columns: ColumnDef<EventRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "venue", header: "Venue" },
  { accessorKey: "startsAt", header: "Starts" },
  {
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) =>
      row.original.isPublished ? <Badge variant="success">Published</Badge> : <Badge variant="secondary">Draft</Badge>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/events/${row.original.id}`}>Edit</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/admin/events/${row.original.id}/ticket-types`}>Ticket Types</Link>
        </Button>
      </div>
    ),
  },
];

export function EventsTable({ data }: { data: EventRow[] }) {
  return <DataTable columns={columns} data={data} />;
}

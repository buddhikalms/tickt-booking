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
  coverImage: string | null;
  isPublished: boolean;
};

const columns: ColumnDef<EventRow>[] = [
  {
    accessorKey: "coverImage",
    header: "Image",
    cell: ({ row }) =>
      row.original.coverImage ? (
        <div
          aria-label={`${row.original.title} cover`}
          className="h-16 w-24 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${row.original.coverImage})` }}
        />
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No image
        </div>
      ),
  },
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

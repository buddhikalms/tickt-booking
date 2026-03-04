import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== Role.ADMIN && role !== Role.STAFF)) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="theme-card h-fit rounded-2xl border p-4 backdrop-blur">
        <div className="theme-panel mb-4 rounded-xl border p-3">
          <p className="theme-muted-text text-xs uppercase tracking-wider">Admin Console</p>
          <p className="mt-1 text-sm font-semibold">{session.user.email}</p>
          <Badge className="mt-2 w-fit" variant="secondary">
            <ShieldCheck className="mr-1 h-3 w-3" />
            {session.user.role}
          </Badge>
        </div>
        <AdminNav />
      </aside>
      <div>{children}</div>
    </div>
  );
}

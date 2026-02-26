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
      <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mb-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Admin Console</p>
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

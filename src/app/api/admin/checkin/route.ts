import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkInTicket } from "@/lib/checkin";

export async function POST(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== Role.ADMIN && role !== Role.STAFF)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const input = String(body.code ?? "").trim();
  if (!input) {
    return NextResponse.json({ ok: false, message: "Ticket code or ticket ID is required." }, { status: 400 });
  }

  const result = await checkInTicket(input, session.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

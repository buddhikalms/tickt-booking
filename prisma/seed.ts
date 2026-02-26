import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "System Admin", role: Role.ADMIN, passwordHash },
    create: {
      email: adminEmail,
      name: "System Admin",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const event = await prisma.event.upsert({
    where: { id: "seed-launch-event" },
    update: {
      isPublished: true,
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 60 * 4),
    },
    create: {
      id: "seed-launch-event",
      title: "Launch Night 2026",
      description: "A premium event experience with music, networking, and live performances.",
      venue: "Grand Hall",
      address: "123 Main St, New York, NY",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 60 * 4),
      coverImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200",
      isPublished: true,
    },
  });

  const ticketTypes = [
    { name: "Normal", priceCents: 4900, quantity: 300 },
    { name: "VIP", priceCents: 14900, quantity: 120 },
    { name: "VVIP", priceCents: 34900, quantity: 40 },
  ];

  for (const type of ticketTypes) {
    await prisma.ticketType.upsert({
      where: {
        id: `${event.id}-${type.name.toLowerCase()}`,
      },
      update: {
        name: type.name,
        priceCents: type.priceCents,
        quantity: type.quantity,
        isActive: true,
        currency: "USD",
      },
      create: {
        id: `${event.id}-${type.name.toLowerCase()}`,
        eventId: event.id,
        name: type.name,
        priceCents: type.priceCents,
        currency: "USD",
        quantity: type.quantity,
        isActive: true,
      },
    });
  }

  console.log(`Seed completed. Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

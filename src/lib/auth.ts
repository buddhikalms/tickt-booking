import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const baseAdapter = PrismaAdapter(prisma) as Adapter;
const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data: Parameters<Exclude<Adapter["createUser"], undefined>>[0]) {
    // Keep compatibility with an already generated Prisma client that doesn't include image/emailVerified fields yet.
    if (!baseAdapter.createUser) {
      throw new Error("Adapter createUser is unavailable");
    }
    const normalized = {
      email: "email" in data ? data.email : "",
      name: "name" in data ? data.name : null,
    };
    return baseAdapter.createUser(normalized as never);
  },
};

export const authOptions: NextAuthOptions = {
  adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  logger: {
    error(code, metadata) {
      // A stale session cookie after secret rotation should be treated as logged out.
      if (code === "JWT_SESSION_ERROR" && isJwtDecryptionError(metadata)) {
        return;
      }
      console.error(`[next-auth][error][${code}]`, metadata);
    },
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.CUSTOMER;
      }
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role ?? Role.CUSTOMER;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.CUSTOMER;
      }
      return session;
    },
  },
};

function isJwtDecryptionError(error: unknown): boolean {
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (typeof current === "string") {
      const value = current.toLowerCase();
      if (value.includes("decryption operation failed") || value.includes("jwt_session_error")) {
        return true;
      }
      continue;
    }

    if (typeof current !== "object") {
      continue;
    }

    const record = current as Record<string, unknown>;
    const name = record.name;
    if (typeof name === "string" && name.toLowerCase().includes("jwedecryptionfailed")) {
      return true;
    }

    const message = record.message;
    if (typeof message === "string") {
      const value = message.toLowerCase();
      if (value.includes("decryption operation failed") || value.includes("jwt_session_error")) {
        return true;
      }
    }

    if ("cause" in record) {
      queue.push(record.cause);
    }
  }

  return false;
}

export async function auth() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    // Secret rotation or stale cookies should log users out, not crash server rendering.
    if (isJwtDecryptionError(error)) {
      return null;
    }
    throw error;
  }
}

export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

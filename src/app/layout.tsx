import type { Metadata } from "next";
import { Merriweather, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Temple Tickets",
    template: "%s | Temple Tickets",
  },
  description: "Ticket booking and event coordination for Buddhist temple programs, dana, and community gatherings.",
  openGraph: {
    title: "Temple Tickets",
    description: "Reserve seats for Buddhist temple events with secure checkout and instant confirmation.",
    type: "website",
    siteName: "Temple Tickets",
  },
  twitter: {
    card: "summary_large_image",
    title: "Temple Tickets",
    description: "Book Buddhist temple events with secure checkout and instant ticket delivery.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sourceSans.variable} ${merriweather.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Providers>
          <header className="sticky top-0 z-40 border-b border-amber-200/80 bg-amber-50/90 backdrop-blur dark:border-amber-900/80 dark:bg-amber-950/85">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-semibold">
                  Temple Tickets
                </Link>
                <nav className="hidden items-center gap-4 text-sm text-amber-950/90 md:flex dark:text-amber-50/90">
                  <Link href="/">Programs</Link>
                  {session?.user ? <Link href="/dashboard">My Dashboard</Link> : null}
                  {session?.user?.role === "ADMIN" || session?.user?.role === "STAFF" ? (
                    <Link href="/admin">Admin</Link>
                  ) : null}
                </nav>
              </div>
              <div className="flex items-center gap-2">
                {session?.user ? (
                  <>
                    <span className="hidden text-sm text-amber-950/85 md:inline dark:text-amber-50/85">{session.user.email}</span>
                    <Button asChild type="button" variant="outline" size="sm">
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-1 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    {(session.user.role === "ADMIN" || session.user.role === "STAFF") ? (
                      <Badge variant="secondary" className="hidden md:inline-flex">
                        {session.user.role}
                      </Badge>
                    ) : null}
                    <Button asChild type="button" variant="outline" size="sm">
                      <Link href="/api/auth/signout">Logout</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </>
                )}
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

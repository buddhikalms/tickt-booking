import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "EventSphere Ticketing",
    template: "%s | EventSphere",
  },
  description: "Modern ticket booking and event management with secure checkout and instant e-ticket delivery.",
  openGraph: {
    title: "EventSphere Ticketing",
    description: "Book events with a premium, mobile-first experience.",
    type: "website",
    siteName: "EventSphere",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventSphere Ticketing",
    description: "Book events with secure checkout and instant ticket delivery.",
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
      <body className={`${poppins.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Providers>
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-semibold">
                  EventSphere
                </Link>
                <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex dark:text-slate-300">
                  <Link href="/">Events</Link>
                  {session?.user ? <Link href="/dashboard">My Dashboard</Link> : null}
                  {session?.user?.role === "ADMIN" || session?.user?.role === "STAFF" ? (
                    <Link href="/admin">Admin</Link>
                  ) : null}
                </nav>
              </div>
              <div className="flex items-center gap-2">
                {session?.user ? (
                  <>
                    <span className="hidden text-sm text-slate-500 md:inline dark:text-slate-400">{session.user.email}</span>
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
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
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

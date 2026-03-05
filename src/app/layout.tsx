import type { Metadata } from "next";
import { Merriweather, Source_Sans_3 } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Facebook, Globe, LayoutDashboard, Mail, MapPin, Phone } from "lucide-react";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import "./globals.css";

const footerSocialLinks = [
  {
    href: "https://www.facebook.com/SriSambuddhaVihara/",
    label: "Facebook",
    icon: Facebook,
  },
] as const;

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
    default: "Sri Sambuddha Viharaya Tickets",
    template: "%s | Sri Sambuddha Viharaya Tickets",
  },
  description: "Ticket booking and event coordination for Buddhist temple programs, dana, and community gatherings.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Sri Sambuddha Viharaya Tickets",
    description: "Reserve seats for Buddhist temple events with secure checkout and instant confirmation.",
    type: "website",
    siteName: "Sri Sambuddha Viharaya Tickets",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sri Sambuddha Viharaya Tickets",
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
          <header className="theme-shell sticky top-0 z-40 border-b backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center" aria-label="Temple Tickets home">
                  <Image
                    src="/srisambuddhaviharaya_Web_logo.png"
                    alt="Sri Sambuddha Viharaya logo"
                    width={375}
                    height={124}
                    priority
                    className="h-10 w-auto"
                  />
                </Link>
                <nav className="theme-soft-text hidden items-center gap-4 text-sm md:flex">
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
                    <span className="theme-muted-text hidden text-sm md:inline">{session.user.email}</span>
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
          <footer className="theme-shell border-t">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-[1.2fr_1fr_0.9fr] md:px-6">
              <div className="space-y-4">
                <Link href="/" className="inline-flex items-center" aria-label="Temple Tickets home">
                  <Image
                    src="/srisambuddhaviharaya_Web_logo.png"
                    alt="Sri Sambuddha Viharaya logo"
                    width={375}
                    height={124}
                    className="h-12 w-auto"
                  />
                </Link>
                <div className="space-y-2">
                  <p className="font-serif text-lg font-bold">
                    Liverpool Sri Sambuddha Buddhist Temple Foundation
                  </p>
                  <p className="theme-muted-text max-w-xl text-sm leading-6">
                    Reserve seats for temple programs, dana, and community gatherings with secure checkout and instant confirmations.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-lg font-bold">Contact</h2>
                <div className="theme-soft-text space-y-3 text-sm">
                  <a
                    href="https://maps.google.com/?q=120%20Carr%20Lane%20East,%20Liverpool%20L11%204SL"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 transition-colors hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>120 Carr Lane East, Liverpool L11 4SL</span>
                  </a>
                  <a
                    href="tel:01514765227"
                    className="flex items-center gap-3 transition-colors hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>0151 476 5227</span>
                  </a>
                  <a
                    href="mailto:info@srisambuddhaviharaya.com"
                    className="flex items-center gap-3 transition-colors hover:text-amber-700 dark:hover:text-amber-300"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>info@srisambuddhaviharaya.com</span>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-lg font-bold">Follow</h2>
                <div className="flex flex-wrap gap-3">
                  {footerSocialLinks.map(({ href, icon: Icon, label }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-200"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </a>
                  ))}
                  <a
                    href="https://www.srisambuddhaviharaya.com/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Official website"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-200"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Official Website</span>
                  </a>
                </div>
                <div className="theme-soft-text pt-2 text-sm">
                  <p className="mb-2 text-xs">All tickets are non-refundable.</p>
                  <Link
                    href="/privacy-policy"
                    className="underline-offset-4 transition-colors hover:text-amber-700 hover:underline dark:hover:text-amber-300"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

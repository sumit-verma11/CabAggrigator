import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "RideCompare — Compare Uber, Ola, Rapido & Namma Yatri fares",
  description:
    "Compare cab, auto and bike fares across Uber, Ola, Rapido and ONDC (Namma Yatri) in one place. Book the cheapest ride instantly.",
  keywords: [
    "cab price comparison",
    "Uber vs Ola",
    "Rapido fare",
    "Namma Yatri",
    "ONDC mobility",
  ],
  openGraph: {
    title: "RideCompare — one search, every cab platform",
    description:
      "Compare fares across Uber, Ola, Rapido and ONDC, then book the best ride.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t divider">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-sm text-muted sm:flex-row">
            <span>© {new Date().getFullYear()} RideCompare</span>
            <span className="text-faint">
              Fares are tariff-based estimates · India
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}

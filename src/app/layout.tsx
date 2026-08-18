import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const aileronSubstitute = Manrope({
  subsets: ["latin"],
  variable: "--font-aileron",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cadence | AI Voice Notes & Schedule",
  description: "AI Voice Note Taker + Class Scheduler. Your voice becomes your schedule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${aileronSubstitute.variable} ${plexMono.variable} antialiased`}
      >
        <div className="min-h-screen relative bg-bg text-fg">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-plex-mono" });

export const metadata: Metadata = { title: "Tracker", description: "Goals and daily tracker" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

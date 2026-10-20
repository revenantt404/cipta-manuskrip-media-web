import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { metadataSitus } from "@/lib/site-metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata root dibentuk fungsi murni di `lib/site-metadata.ts` — layout
// tidak dapat diimpor di Vitest karena `next/font/google`.
export const metadata: Metadata = metadataSitus();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

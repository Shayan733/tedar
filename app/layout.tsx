import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TEDAR — Content Intelligence for YouTube Creators",
  description:
    "TEDAR finds outlier videos in any niche, decodes the psychology behind " +
    "their transcripts and audience reactions, and turns it into production briefs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
          TEDAR — decode why videos win: the content, the audience, the playbook.
        </footer>
      </body>
    </html>
  );
}

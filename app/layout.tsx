import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Oswald } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// FIFA-style display fonts
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "AureakForm — Tracker forme & blessures",
  description: "Module wellness pour sélection nationale du Burundi 🇧🇮",
  applicationName: "AureakForm",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AureakForm",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${oswald.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-[#f4f5f7]">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed, DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Repwise — train smarter, log every rep",
  description: "Science-backed workout plans, a rich exercise library, and progress tracking that adapts to you.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get("fm-theme")?.value === "light" ? "light" : "dark") as "light" | "dark";

  return (
    <html
      lang="en"
      data-theme={theme === "light" ? "light" : ""}
      className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers initialTheme={theme as "light" | "dark"}>{children}</Providers>
      </body>
    </html>
  );
}

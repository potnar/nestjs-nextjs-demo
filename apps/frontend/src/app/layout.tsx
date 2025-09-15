// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";

export const metadata = {
  title: "App",
  description: "",
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale(); 
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}

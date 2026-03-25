import type React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryClientProvider from "@/components/QueryClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { InitialTimeZoneDetector } from "@/components/InitialTimeZoneDetector";
import { SettingsProvider } from "@/components/settings-provider";
import {
  defaultSettings,
  isLanguage,
  LANGUAGE_COOKIE_NAME,
} from "@/lib/settings";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "MonthlyGrow - 월간 자기계발 앱",
  description: "월간 기반 자기계발 앱",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  const initialLanguage = isLanguage(cookieLanguage)
    ? cookieLanguage
    : defaultSettings.language;

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body className={inter.className}>
        <InitialTimeZoneDetector />
        <QueryClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SettingsProvider initialLanguage={initialLanguage}>
              {children}
            </SettingsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

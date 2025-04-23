import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MonthlyGrow - 월간 자기계발 앱",
  description: "월간 루프 기반 자기계발 앱",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // localstorage에서 사용자 정보 저장 여부를 확인하여 user info 유무 확인
  // user info 있다면 주요 정보 새로 페칭 후 jotai에 저장 -> home으로 이동
  // user info 없다면 remain

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

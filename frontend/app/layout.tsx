import type { Metadata } from "next";
import "./globals.css";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";

export const metadata: Metadata = {
  title: "GeoVote - 世界最美地标投票",
  description: "基于 FHEVM 的全球地标投票 DApp，所有投票链上存证，公开透明不可篡改",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <InMemoryStorageProvider>
          {children}
        </InMemoryStorageProvider>
      </body>
    </html>
  );
}

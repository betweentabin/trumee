import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers';
import ApiVersionProvider from '@/components/ApiVersionProvider';




const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TruMee - 転職支援プラットフォーム",
  description: "TruMeeは求職者と企業をつなぐ転職支援プラットフォームです",
  icons: {
    icon: "/logo/logo.png",
    shortcut: "/logo/logo.png",
    apple: "/logo/logo.png",
  },
  openGraph: {
    title: "TruMee - 転職支援プラットフォーム",
    description: "TruMeeは求職者と企業をつなぐ転職支援プラットフォームです",
    url: "https://trumeee.vercel.app",
    images: ["/logo/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApiVersionProvider>
          <Providers>{children}</Providers>
        </ApiVersionProvider>
        <Toaster position="top-right" reverseOrder={false} />

      </body>
    </html>
  );
}

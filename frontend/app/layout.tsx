import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
    icon: "/logo/logo_mix_fabicon.png",
    shortcut: "/logo/logo_mix_fabicon.png",
    apple: "/logo/logo_mix_fabicon.png",
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
  alternates: {
    canonical: "https://trumeee.vercel.app",
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
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-R0M0DLXTZG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // GA4（Truemee_Stream）
            gtag('config', 'G-R0M0DLXTZG');

            // Google広告（コンバージョン測定）
            gtag('config', 'AW-11411033135');
          `}
        </Script>

        <ApiVersionProvider>
          <Providers>{children}</Providers>
        </ApiVersionProvider>
        <Toaster position="top-right" reverseOrder={false} />

      </body>
    </html>
  );
}

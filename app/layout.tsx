import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from 'nextjs-toploader';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Analytics } from "@vercel/analytics/next"
import Script from 'next/script';
import { siteConfig } from "@/lib/site-config";

const montserrat = Montserrat({ subsets: ["latin"] });

const title = "My Dress Floripa | Aluguel de vestidos de festa em Florianópolis";
const description =
  "Aluguel de vestidos de festa em Florianópolis. Vestidos para madrinhas, formaturas, casamentos e eventos. Escolha online e prove no nosso provador em Coqueiros.";

// IDs do Google e verificações vêm do .env para não depender de contas antigas
const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID;
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const googleTagIds = [googleAnalyticsId, googleAdsId].filter(Boolean) as string[];

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.fullName,
  title: {
    default: title,
    template: `%s | ${siteConfig.fullName}`,
  },
  description,
  keywords: [
    "aluguel de vestidos florianópolis",
    "aluguel de vestido de festa floripa",
    "vestido de madrinha florianópolis",
    "vestido de formatura florianópolis",
    "aluguel de vestido coqueiros",
    "vestido para casamento civil",
    "My Dress Floripa",
  ],
  authors: [{ name: siteConfig.fullName }],
  creator: siteConfig.fullName,
  publisher: siteConfig.legalName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: siteConfig.fullName,
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteConfig.fullName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.FACEBOOK_DOMAIN_VERIFICATION
      ? { "facebook-domain-verification": process.env.FACEBOOK_DOMAIN_VERIFICATION }
      : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "shopping",
  other: {
    "msapplication-TileColor": "#29161f",
    "msapplication-config": "/browserconfig.xml",
    "geo.region": `BR-${siteConfig.address.state}`,
    "geo.placename": siteConfig.address.city,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#fbf7f2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
  <SessionProvider session={session}>
      <html lang="pt-br" suppressHydrationWarning>
        <head>
          {/* Google Analytics / Google Ads: só carrega se NEXT_PUBLIC_GA_ID ou NEXT_PUBLIC_GOOGLE_ADS_ID estiverem no .env */}
          {googleTagIds.length > 0 && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${googleTagIds[0]}`}
                strategy="afterInteractive"
              />
              <Script id="google-tag" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  ${googleTagIds.map((id) => `gtag('config', '${id}');`).join("\n")}
                `}
              </Script>
            </>
          )}
        </head>
        <body className={montserrat.className} suppressHydrationWarning>
          <NextTopLoader
            color="#b8196f"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #b8196f,0 0 5px #b8196f" />
          
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            
            {children}
            <SpeedInsights />
            <Analytics/>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
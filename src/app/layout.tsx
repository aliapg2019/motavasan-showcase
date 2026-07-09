import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "محتواسان | تولید محتوای فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین",
  description:
    "پلتفرم تولید محتوای هوشمند فارسی با هوش مصنوعی. کپشن اینستاگرام، استوری، ریلز، متن تبلیغاتی و هشتگ هدفمند برای فروشندگان آنلاین ایران. تولید محتوای فروشی حرفه‌ای در چند ثانیه.",
  keywords: [
    "تولید محتوا",
    "هوش مصنوعی",
    "کپشن اینستاگرام",
    "محتوای فارسی",
    "بازاریابی محتوا",
    "اینستاگرام مارکتینگ",
    "تولید محتوای فروشی",
    "استوری اینستاگرام",
    "ریلز اینستاگرام",
    "هشتگ فارسی",
    "متن تبلیغاتی",
    "فروش آنلاین",
    "کسب و کار آنلاین",
    "صدای برند",
    "محتواسان",
  ],
  authors: [{ name: "محتواسان" }],
  creator: "محتواسان",
  publisher: "محتواسان",
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
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "محتواسان",
    title: "محتواسان | تولید محتوای فارسی با هوش مصنوعی",
    description:
      "پلتفرم تولید محتوای هوشمند فارسی. کپشن اینستاگرام، استوری، ریلز و متن تبلیغاتی حرفه‌ای با هوش مصنوعی برای فروشندگان آنلاین ایران.",
  },
  twitter: {
    card: "summary_large_image",
    title: "محتواسان | تولید محتوای فارسی با هوش مصنوعی",
    description:
      "تولید محتوای فروشی فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین ایران",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "32x32" },
      { url: "/logo.svg", type: "image/svg+xml", sizes: "64x64" },
    ],
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Structured Data - JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "محتواسان",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "پلتفرم تولید محتوای هوشمند فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین ایران",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "0",
                highPrice: "490000",
                priceCurrency: "IRR",
                offerCount: "3",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1200",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "محتواسان",
              description:
                "تولید محتوای فروشی فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین",
              potentialAction: {
                "@type": "SearchAction",
                target: "/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground font-[Vazirmatn,sans-serif]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

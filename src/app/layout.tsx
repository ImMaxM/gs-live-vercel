import "../styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Saira } from "next/font/google";
import { F1LiveProvider } from "~/components/providers/F1LiveProvider";
import { SettingsProvider } from "~/components/providers/SettingsProvider";

import { GoogleAnalytics } from "@next/third-parties/google";

export const viewport: Viewport = {
  themeColor: "#DF3A39",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://live.gridscout.xyz"),
  title: "GridScout Live",
  description:
    "Real-time F1 live timing dashboard. Experience Formula 1 race data with live lap times, driver positions and tyre stints right within your browser.",
  keywords: [
    "F1",
    "Formula 1",
    "live timing",
    "race timing",
    "lap times",
    "Discord",
    "motorsport",
    "racing",
    "gridscout",
  ],
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://live.gridscout.xyz",
    siteName: "GridScout",
    title: "GridScout Live",
    description:
      "Real-time F1 live timing dashboard. Experience Formula 1 race data with live lap times, driver positions and tyre stints right within your browser",
    images: [
      {
        url: "/assets/hero.png",
        width: 1200,
        height: 630,
        alt: "GridScout Live - Real-time F1 live timing dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GridScout Live",
    description:
      "Real-time F1 live timing dashboard. Experience Formula 1 race data with live lap times, driver positions and tyre stints right within your browser",
    images: ["/assets/hero.png"],
  },
};

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira-sans",
  display: "swap", // Prevents FOIT (Flash of Invisible Text)
  preload: true,
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${saira.variable}`}>
      <body className="bg-background">
        <SettingsProvider>
          <F1LiveProvider>{children}</F1LiveProvider>
        </SettingsProvider>
        <GoogleAnalytics gaId="G-Q9G8YHJ4S8" />
      </body>
    </html>
  );
}

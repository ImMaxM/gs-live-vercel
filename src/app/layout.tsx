import "../styles/globals.css";

import { type Metadata } from "next";
import { Saira } from "next/font/google";
import { F1LiveProvider } from "~/components/providers/F1LiveProvider";
import { SettingsProvider } from "~/components/providers/SettingsProvider";

import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "GridScout Live",
  description: "Real-time F1 live timing dashboard",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      <head>
        {/* Preconnect to external origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>
      <body className="bg-background">
        <SettingsProvider>
          <F1LiveProvider>{children}</F1LiveProvider>
        </SettingsProvider>
        <GoogleAnalytics gaId="G-Q9G8YHJ4S8" />
      </body>
    </html>
  );
}

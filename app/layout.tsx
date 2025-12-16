import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";


export const metadata: Metadata = {
  title: "MTR Tracker",
  description: "created by rev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico"/>
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

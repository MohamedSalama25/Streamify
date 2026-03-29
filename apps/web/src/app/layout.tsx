import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_NAME } from "@streamify/shared";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} Elite | Real-time Collaboration`,
  description:
    "Experience the next generation of digital meeting environments. High-fidelity sync, architectural clarity, and professional-grade security built for elite teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

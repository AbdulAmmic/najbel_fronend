import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",      // render immediately with fallback; don't block
  preload: false,       // skip blocking preload on every route
  fallback: ["Inter", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Najbel Systems",
  description: "Software Developed by: Abdul Ammic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

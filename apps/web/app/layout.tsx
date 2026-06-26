import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME || "Trailhead"} — Scout Manager`,
  description: "Scout workflow, roster, and gear management.",
};
export const viewport: Viewport = { themeColor: "#2b3d31" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Public+Sans:wght@0,400;0,500;0,600;0,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

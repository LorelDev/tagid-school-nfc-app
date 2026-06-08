import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tagid – NFC Learning Platform",
  description:
    "NFC-based interactive learning platform for schools. Tap a tag, complete a mission.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

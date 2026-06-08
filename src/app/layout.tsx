import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "תגיד – למידה אינטראקטיבית עם תגי NFC",
  description:
    "לגעת. לגלות. להגיד. הופכים את בית הספר למרחב למידה אינטראקטיבי באמצעות תגי NFC.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VastuFlow — Smart Vastu Analysis",
  description: "Professional-grade Vastu Shastra analysis tool for consultants and architects. Upload floor plans, trace boundaries, and generate comprehensive Vastu compliance reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

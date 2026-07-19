import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000";

  return {
    title: "Part-Time Tech — Serious work, fewer hours",
    description:
      "Verified part-time and fractional jobs for experienced people in engineering, data, AI, security, product, and design.",
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: "Part-Time Tech — Serious work, fewer hours",
      description:
        "Verified 8–24 hour tech roles with transparent pay, schedules, and working terms.",
      type: "website",
      images: [{ url: `${baseUrl}/og.png`, width: 1736, height: 909 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Part-Time Tech — Serious work, fewer hours",
      description:
        "Verified 8–24 hour tech roles with transparent pay, schedules, and working terms.",
      images: [`${baseUrl}/og.png`],
    },
  };
}

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

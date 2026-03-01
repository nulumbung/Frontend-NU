// This file is for server-side metadata only
import type { Metadata, Viewport } from "next";
import { createDefaultMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createDefaultMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

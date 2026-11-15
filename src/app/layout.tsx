import type { Metadata, Viewport } from "next";
import { Geist, Sora } from "next/font/google";
import { WorkspaceProvider } from "@/components/workspace";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Skills2Cash — Turn what you know into what you can sell",
  description:
    "An AI-powered learning platform that helps adults turn existing skills into clear, priced services — with practice against realistic AI clients.",
};

export const viewport: Viewport = {
  themeColor: "#08060d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${sora.variable}`}>
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}

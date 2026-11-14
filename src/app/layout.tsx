import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { WorkspaceProvider } from "@/components/workspace";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "Skills2Cash — Turn what you know into what you can sell",
  description:
    "An AI-powered learning platform that helps adults turn existing skills into clear, priced services — with practice against realistic AI clients.",
};

export const viewport: Viewport = {
  themeColor: "#0a0910",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}

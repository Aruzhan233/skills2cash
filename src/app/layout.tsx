import type { Metadata, Viewport } from "next";
import { WorkspaceProvider } from "@/components/workspace";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skills2Cash — Turn what you know into what you can sell",
  description:
    "An AI-powered learning platform that helps adults turn existing skills into clear, priced services — with practice against realistic AI clients.",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}

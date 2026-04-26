import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Concordis — Scientific Evidence Engine",
  description: "Evidence-based answers synthesized from published research.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

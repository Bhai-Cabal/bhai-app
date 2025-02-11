import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Web3 Professional Network",
  description: "Connect with professionals in the Web3 space",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <script
  async
  defer
  src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDHkFGtlCPx-3iUI7DxEBQA3eAzJfPvjI4&libraries=places`}
></script> */}
      <body className={inter.className}>
        <Providers>
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
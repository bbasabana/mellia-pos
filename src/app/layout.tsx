import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import { ToastContainer } from "@/components/ui/Toast";
import "./globals.css";
import "@/styles/products.scss";

export const metadata: Metadata = {
  title: "Mellia POS",
  description: "Restaurant POS & ERP System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mellia POS",
  },
  icons: {
    icon: "/images/logos/logo.png",
    apple: "/images/logos/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00d3fa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}

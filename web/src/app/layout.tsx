import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Freebuff - AI Automation for Your Business",
  description:
    "Automate WhatsApp customer support, appointments, lead generation, and more with AI.",
  keywords: ["whatsapp automation", "ai chatbot", "business automation", "lead generation"],
  openGraph: {
    title: "Freebuff - AI Automation for Your Business",
    description:
      "Automate WhatsApp customer support, appointments, lead generation, and more with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "12px",
                padding: "16px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

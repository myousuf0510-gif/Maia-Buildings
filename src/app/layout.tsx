import type { Metadata } from "next";
import { Space_Grotesk, Montserrat } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-montserrat",
});
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MAIA Intelligence — Intelligence. Precision. Action.",
  description: "Enterprise-grade intelligence platform. Real-time signals, scenario modelling, and actionable insights.",
  openGraph: {
    title: "MAIA Intelligence — Intelligence. Precision. Action.",
    description: "Enterprise-grade intelligence platform. Real-time signals, scenario modelling, and actionable insights.",
    type: "website",
    siteName: "MAIA Intelligence",
    images: [{ url: "https://i.imgur.com/S1u95P6.jpeg", width: 1200, height: 630, alt: "MAIA Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAIA Intelligence — Intelligence. Precision. Action.",
    description: "Enterprise-grade intelligence platform. Real-time signals, scenario modelling, and actionable insights.",
    images: ["https://i.imgur.com/S1u95P6.jpeg"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
    shortcut: [{ url: "/favicon.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${montserrat.variable} font-sans antialiased min-h-screen`}
        style={{ background: "#F8FAFC", color: "#0F172A" }}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

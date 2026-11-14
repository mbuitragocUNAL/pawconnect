import type { Metadata, Viewport } from "next";
import { DM_Mono, Funnel_Display, Funnel_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
});

const funnelSans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "PawConnect · Perros y gatos perdidos y encontrados",
    template: "%s · PawConnect",
  },
  description:
    "Publica la foto de un perro o un gato perdido o encontrado en Bogotá y la Sabana. PawConnect la compara con los reportes de la zona y tú decides si es tu animal.",
};

export const viewport: Viewport = {
  themeColor: "#fbf9f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${funnelDisplay.variable} ${funnelSans.variable} ${dmMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

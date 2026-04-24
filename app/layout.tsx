import type { Metadata, Viewport } from "next"
import { Inter, Fraunces } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MIRA — Detección Temprana del Desarrollo Infantil",
  description:
    "Herramienta gratuita de cribado basada en M-CHAT-R/F y Modelo Denver. Ayuda a identificar señales tempranas de autismo.",
  generator: "v0.app",
  openGraph: {
    title: "MIRA — Detección Temprana del Desarrollo Infantil",
    description:
      "Herramienta gratuita de cribado basada en M-CHAT-R/F y Modelo Denver. Ayuda a identificar señales tempranas de autismo.",
    type: "website",
    locale: "es_ES",
    siteName: "MIRA",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIRA — Detección Temprana del Desarrollo Infantil",
    description:
      "Herramienta gratuita de cribado basada en M-CHAT-R/F y Modelo Denver. Ayuda a identificar señales tempranas de autismo.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#11161f" },
  ],
  width: "device-width",
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}

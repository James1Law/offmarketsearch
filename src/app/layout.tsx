import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://offline.homes"),
  title: "Offline.homes — Write to homeowners before they sell",
  description:
    "Find your dream home before it hits the market. Select houses on a map, write a personal letter, and we'll post it for you.",
  openGraph: {
    title: "Offline.homes — Write to homeowners before they sell",
    description:
      "Find your dream home before it hits the market. Select houses on a map, write a personal letter, and we'll post it for you.",
    url: "https://offline.homes",
    siteName: "Offline.homes",
    locale: "en_GB",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-navy">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

import type { ReactNode, CSSProperties } from "react"
import type { Viewport } from "next"
import { MobileStepNav } from "@/components/mobile/MobileStepNav"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf3e7",
}

const containerStyle: CSSProperties = {
  minHeight: "100dvh",
  paddingTop: "env(safe-area-inset-top)",
}

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col bg-cream text-navy" style={containerStyle}>
      <MobileStepNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  )
}

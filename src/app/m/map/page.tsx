import { MobileMapPageClient } from "@/features/map/components/MobileMapPageClient"

export const metadata = { title: "Find houses — Offline.homes" }

export default function MobileMapPage() {
  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 3rem - env(safe-area-inset-top))" }}
    >
      <MobileMapPageClient />
    </div>
  )
}

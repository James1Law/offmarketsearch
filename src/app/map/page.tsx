import { StepNav } from "@/components/step-nav"
import { MapPageClient } from "@/features/map/components/MapPageClient"

export const metadata = { title: "Find houses — Offline.homes" }

export default function MapPage() {
  return (
    <>
      <StepNav />
      <MapPageClient />
    </>
  )
}

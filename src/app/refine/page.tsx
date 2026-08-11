import { StepNav } from "@/components/step-nav"
import { RefinePageClient } from "@/features/refine/components/RefinePageClient"

export const metadata = { title: "Refine your results — Offline.homes" }

export default function RefinePage() {
  return (
    <div className="flex flex-col h-screen">
      <StepNav />
      <RefinePageClient />
    </div>
  )
}

import { StepNav } from "@/components/step-nav"
import { LetterPageClient } from "@/features/letter/components/LetterPageClient"

export const metadata = { title: "Write your letter — Offline.homes" }

export default function LetterPage() {
  return (
    <div className="flex flex-col h-screen">
      <StepNav />
      <LetterPageClient />
    </div>
  )
}

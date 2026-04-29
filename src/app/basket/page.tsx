import { StepNav } from "@/components/step-nav"
import { BasketSummary } from "@/features/basket/components/BasketSummary"

export const metadata = { title: "Review & pay — LetterDrop" }

export default function BasketPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <StepNav />
      <main className="flex-1">
        <BasketSummary />
      </main>
    </div>
  )
}

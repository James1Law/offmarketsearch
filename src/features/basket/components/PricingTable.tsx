import { PRICING, formatPence } from "@/lib/constants"

interface PricingTableProps {
  letterCount: number
}

export function PricingTable({ letterCount }: PricingTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Pack pricing
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {/* Per letter */}
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            letterCount < 5 ? "bg-indigo-50" : ""
          }`}
        >
          <div>
            <span className="text-sm font-medium text-slate-700">Pay as you go</span>
            <span className="ml-2 text-xs text-slate-400">per letter</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {formatPence(PRICING.PER_LETTER_PENCE)}
          </span>
        </div>
        {/* Packs */}
        {PRICING.PACKS.map((pack) => {
          const perLetter = pack.pricePence / pack.quantity
          const saving = PRICING.PER_LETTER_PENCE - perLetter
          const isBestFit =
            letterCount >= pack.quantity &&
            !PRICING.PACKS.some(
              (p) => p.quantity > pack.quantity && letterCount >= p.quantity,
            )
          return (
            <div
              key={pack.quantity}
              className={`flex items-center justify-between px-4 py-3 ${
                isBestFit ? "bg-indigo-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{pack.label}</span>
                {isBestFit && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                    Best value
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {formatPence(pack.pricePence)}
                </div>
                <div className="text-xs text-slate-400">
                  Save {formatPence(Math.round(saving * pack.quantity))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

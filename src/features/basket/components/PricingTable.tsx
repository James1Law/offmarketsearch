import { PRICING, formatPence } from "@/lib/constants"

interface PricingTableProps {
  letterCount: number
}

export function PricingTable({ letterCount }: PricingTableProps) {
  return (
    <div className="rounded-xl border border-sand overflow-hidden">
      <div className="bg-cream px-4 py-2.5 border-b border-sand">
        <span className="text-xs font-semibold text-navy-soft uppercase tracking-wider">
          Pack pricing
        </span>
      </div>
      <div className="divide-y divide-sand">
        {/* Per letter */}
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            letterCount < 5 ? "bg-cream" : ""
          }`}
        >
          <div>
            <span className="text-sm font-medium text-navy">Pay as you go</span>
            <span className="ml-2 text-xs text-navy-soft/70">per letter</span>
          </div>
          <span className="text-sm font-semibold text-navy">
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
                isBestFit ? "bg-cream" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-navy">{pack.label}</span>
                {isBestFit && (
                  <span className="text-xs bg-coral-soft text-coral-dark px-1.5 py-0.5 rounded font-medium">
                    Best value
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-navy">
                  {formatPence(pack.pricePence)}
                </div>
                <div className="text-xs text-navy-soft/70">
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

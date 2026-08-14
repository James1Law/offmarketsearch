import type { AreaSaleStats } from "@/types/enrichment"

interface AreaInsightsProps {
  stats: AreaSaleStats
}

export function AreaInsights({ stats }: AreaInsightsProps) {
  const tiles = [
    stats.pricePerSqft !== null && {
      label: "Avg price / sq ft",
      value: `£${Math.round(stats.pricePerSqft)}`,
    },
    stats.daysToSell !== null && {
      label: "Days to sell",
      value: `${Math.round(stats.daysToSell)}`,
    },
    stats.salesNearby12m !== null && {
      label: "Sales nearby (12m)",
      value: `${stats.salesNearby12m}`,
      hint:
        stats.salesYoy !== null
          ? `${stats.salesYoy >= 0 ? "+" : ""}${stats.salesYoy} vs last year`
          : undefined,
    },
    stats.averageYearsOwned !== null && {
      label: "Avg years owned",
      value: `${Math.round(stats.averageYearsOwned)}`,
    },
  ].filter((t): t is { label: string; value: string; hint?: string } => Boolean(t))

  if (tiles.length === 0) return null

  return (
    <section
      aria-label="About this area"
      className="bg-white border border-sand rounded-xl px-4 py-3 mb-4"
    >
      <h2 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2.5">
        About this area
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <div className="text-lg font-bold text-navy leading-tight">{tile.value}</div>
            <div className="text-[11px] text-navy-soft mt-0.5">{tile.label}</div>
            {tile.hint && <div className="text-[10px] text-navy-soft/70">{tile.hint}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import { formatPence, calcTotalPence, PRICING } from "@/lib/constants"
import { StickyCTA } from "@/components/mobile/StickyCTA"
import { renderTemplate } from "@/features/letter/templates/friendly-home-mover"

export function MobileBasketSummary() {
  const router = useRouter()
  const state = useCampaignStore()
  const { selectedAddresses, letterContent } = state

  if (selectedAddresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-6 py-12">
        <p className="text-sm text-slate-600">Your basket is empty.</p>
        <Link href="/m/map" className="text-indigo-600 font-medium text-sm hover:underline">
          ← Go back to find addresses
        </Link>
      </div>
    )
  }

  const totalPence = calcTotalPence(selectedAddresses.length)
  const letterSnippet = letterContent
    ? renderTemplate(letterContent).slice(0, 180) + "…"
    : null

  function handleProceed() {
    router.push("/m/confirm")
  }

  function handleRemoveAddress(id: string) {
    const addr = selectedAddresses.find((a) => a.id === id)
    if (addr) campaignStore.toggleAddress(addr)
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-50">
      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Addresses */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            {selectedAddresses.length}{" "}
            {selectedAddresses.length === 1 ? "address" : "addresses"}
          </h2>
          <ul className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden">
            {selectedAddresses.map((addr) => (
              <li
                key={addr.id}
                className="flex items-center justify-between px-3 py-2.5"
              >
                <span className="text-sm text-slate-700 truncate pr-3">
                  {addr.displayAddress}
                </span>
                <button
                  onClick={() => handleRemoveAddress(addr.id)}
                  className="text-xs text-slate-400 active:text-red-500 shrink-0 px-2 py-1"
                  aria-label={`Remove ${addr.displayAddress}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/m/map"
            className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
          >
            ← Edit addresses
          </Link>
        </section>

        {/* Letter snippet */}
        {letterSnippet && (
          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Your letter</h2>
            <div className="border border-slate-200 rounded-xl bg-white px-4 py-3">
              <p className="text-sm text-slate-600 whitespace-pre-line font-serif leading-relaxed">
                {letterSnippet}
              </p>
            </div>
            <Link
              href="/m/letter"
              className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
            >
              ← Edit letter
            </Link>
          </section>
        )}

        {/* Pricing */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Pricing</h2>
          <div className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
            <PricingRow
              label="Pay as you go"
              subLabel="per letter"
              price={PRICING.PER_LETTER_PENCE}
              highlight={selectedAddresses.length < 5}
            />
            {PRICING.PACKS.map((pack) => {
              const isBestFit =
                selectedAddresses.length >= pack.quantity &&
                !PRICING.PACKS.some(
                  (p) => p.quantity > pack.quantity && selectedAddresses.length >= p.quantity,
                )
              const perLetter = pack.pricePence / pack.quantity
              const saving = (PRICING.PER_LETTER_PENCE - perLetter) * pack.quantity
              return (
                <PricingRow
                  key={pack.quantity}
                  label={pack.label}
                  badge={isBestFit ? "Best value" : null}
                  price={pack.pricePence}
                  saving={Math.round(saving)}
                  highlight={isBestFit}
                />
              )
            })}
          </div>
        </section>

        {/* Order total */}
        <section className="bg-white border border-slate-200 rounded-xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Order total</div>
              <div className="text-xs text-slate-500">
                {selectedAddresses.length} letter
                {selectedAddresses.length !== 1 ? "s" : ""} · inc. postage
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{formatPence(totalPence)}</div>
          </div>
          {!letterContent && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-3">
              You haven&apos;t written your letter yet.{" "}
              <Link href="/m/letter" className="font-medium underline">
                Write it now →
              </Link>
            </p>
          )}
        </section>
      </div>

      <StickyCTA
        hint={
          <span className="text-[11px] text-slate-400">
            Demo mode — no real payment will be taken
          </span>
        }
      >
        <button
          onClick={handleProceed}
          disabled={!letterContent}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 active:bg-indigo-700 text-white"
        >
          Send {selectedAddresses.length}{" "}
          {selectedAddresses.length === 1 ? "letter" : "letters"} —{" "}
          {formatPence(totalPence)}
        </button>
      </StickyCTA>
    </div>
  )
}

function PricingRow({
  label,
  subLabel,
  badge,
  price,
  saving,
  highlight,
}: {
  label: string
  subLabel?: string
  badge?: string | null
  price: number
  saving?: number
  highlight: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${highlight ? "bg-indigo-50" : ""}`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {badge && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
              {badge}
            </span>
          )}
        </div>
        {subLabel && <span className="text-xs text-slate-400">{subLabel}</span>}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-slate-900">{formatPence(price)}</div>
        {saving !== undefined && saving > 0 && (
          <div className="text-xs text-slate-400">Save {formatPence(saving)}</div>
        )}
      </div>
    </div>
  )
}

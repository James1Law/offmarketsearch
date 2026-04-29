"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCampaignStore, campaignStore } from "@/lib/campaign-store"
import { formatPence, calcTotalPence } from "@/lib/constants"
import { PricingTable } from "./PricingTable"
import { renderTemplate } from "@/features/letter/templates/friendly-home-mover"

export function BasketSummary() {
  const router = useRouter()
  const state = useCampaignStore()
  const { selectedAddresses, letterContent } = state

  if (selectedAddresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4">
        <p className="text-slate-600">Your basket is empty.</p>
        <Link href="/map" className="text-indigo-600 font-medium hover:underline">
          ← Go back to find addresses
        </Link>
      </div>
    )
  }

  const totalPence = calcTotalPence(selectedAddresses.length)
  const letterSnippet = letterContent ? renderTemplate(letterContent).slice(0, 180) + "…" : null

  function handleProceed() {
    router.push("/confirm")
  }

  function handleRemoveAddress(id: string) {
    const addr = selectedAddresses.find((a) => a.id === id)
    if (addr) campaignStore.toggleAddress(addr)
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      {/* Addresses */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          {selectedAddresses.length} {selectedAddresses.length === 1 ? "address" : "addresses"}
        </h2>
        <ul className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {selectedAddresses.map((addr) => (
            <li key={addr.id} className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-sm text-slate-700">{addr.displayAddress}</span>
              <button
                onClick={() => handleRemoveAddress(addr.id)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-4 shrink-0"
                aria-label={`Remove ${addr.displayAddress}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <Link href="/map" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
          ← Edit addresses
        </Link>
      </section>

      {/* Letter snippet */}
      {letterSnippet && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Your letter</h2>
          <div className="border border-slate-200 rounded-xl bg-white px-5 py-4">
            <p className="text-sm text-slate-600 whitespace-pre-line font-serif leading-relaxed">
              {letterSnippet}
            </p>
          </div>
          <Link href="/letter" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
            ← Edit letter
          </Link>
        </section>
      )}

      {/* Pricing */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Pricing</h2>
        <PricingTable letterCount={selectedAddresses.length} />
      </section>

      {/* Order total + CTA */}
      <section className="bg-white border border-slate-200 rounded-xl px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">Order total</div>
            <div className="text-sm text-slate-500">
              {selectedAddresses.length} letter{selectedAddresses.length !== 1 ? "s" : ""} · inc.
              postage &amp; printing
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{formatPence(totalPence)}</div>
        </div>

        {!letterContent && (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            You haven&apos;t written your letter yet.{" "}
            <Link href="/letter" className="font-medium underline">
              Write it now →
            </Link>
          </p>
        )}

        <button
          onClick={handleProceed}
          disabled={!letterContent}
          className="w-full py-3 rounded-lg font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Send {selectedAddresses.length} {selectedAddresses.length === 1 ? "letter" : "letters"} —{" "}
          {formatPence(totalPence)}
        </button>
        <p className="text-xs text-slate-400 text-center">
          Demo mode — no real payment will be taken
        </p>
      </section>
    </div>
  )
}

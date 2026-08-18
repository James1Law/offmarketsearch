"use client"

import { useEffect, useState } from "react"
import type { Memorandum } from "@/types/memorandum"
import { buildShareLink, canBuildShareLink, type ShareLink } from "../share-link"
import { DownloadPdfButton } from "./DownloadPdfButton"

interface ShareLinkPanelProps {
  memorandum: Memorandum
  heading: string
  intro: string
  /** What the recipient is being asked to do, for the prefilled message. */
  recipientAction: string
}

/**
 * The handoff.
 *
 * Downloading comes first, and not by accident. The link cannot be made
 * tamper-proof without a server, so the one protection available with no
 * infrastructure is holding your own copy of what you sent — a returned
 * document that differs is then visible. See the plan's §3.
 */
export function ShareLinkPanel({
  memorandum,
  heading,
  intro,
  recipientAction,
}: ShareLinkPanelProps) {
  // Lazy initialiser rather than an effect: browser capability does not change
  // while the page is open, so there is nothing to synchronise.
  const [supported] = useState(canBuildShareLink)
  const [link, setLink] = useState<ShareLink | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    buildShareLink(memorandum, window.location.origin)
      .then((built) => {
        if (!cancelled) setLink(built)
      })
      .catch(() => {
        if (!cancelled) setError("Could not build the link. Please try again.")
      })
    return () => {
      cancelled = true
    }
  }, [memorandum, supported])

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard access can be refused; the link is on screen and selectable.
    }
  }

  return (
    <section className="rounded-xl border border-sand bg-white p-5 flex flex-col gap-5">
      <div>
        <h2 className="font-semibold text-navy">{heading}</h2>
        <p className="text-sm text-navy-soft mt-1 leading-relaxed">{intro}</p>
      </div>

      <div className="rounded-lg bg-cream border border-sand p-4">
        <p className="text-sm font-medium text-navy">1. Keep a copy for yourself</p>
        <p className="text-xs text-navy-soft mt-1 mb-3 leading-relaxed">
          Download it before you send the link, so you have your own record of exactly what you
          agreed to.
        </p>
        <DownloadPdfButton memorandum={memorandum} label="Download your copy" />
      </div>

      <div>
        <p className="text-sm font-medium text-navy">2. Send this link</p>
        <p className="text-xs text-navy-soft mt-1 mb-3 leading-relaxed">{recipientAction}</p>

        {!supported && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            This browser is too old to build a share link. You can still download the PDF above
            and email it across yourself.
          </p>
        )}

        {error && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {link && (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={link.url}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 text-xs font-mono border border-sand rounded-lg px-3 py-2.5 bg-cream text-navy-soft"
              />
              <button
                onClick={copy}
                className="shrink-0 bg-coral hover:bg-coral-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>

            {link.tooLong && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                This link is unusually long ({link.length} characters) and some messaging apps
                will cut it in half. Shortening the free-text sections — what&apos;s included,
                excluded, and any other terms — will bring it down.
              </p>
            )}

            <p className="text-xs text-navy-soft/80 mt-3 leading-relaxed">
              The whole document travels inside the link itself, so nothing is stored on our
              servers and we never see it. That also means the link is the only copy — if it is
              lost, the document is gone.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

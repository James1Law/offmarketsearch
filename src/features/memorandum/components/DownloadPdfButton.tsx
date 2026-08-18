"use client"

import { useState } from "react"
import type { Memorandum } from "@/types/memorandum"

interface DownloadPdfButtonProps {
  memorandum: Memorandum
  label?: string
  variant?: "primary" | "secondary"
}

/**
 * The PDF renderer is about a megabyte, and most visitors never download
 * anything, so it is imported on click rather than at page load.
 */
export function DownloadPdfButton({
  memorandum,
  label = "Download PDF",
  variant = "primary",
}: DownloadPdfButtonProps) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleDownload() {
    setBusy(true)
    setFailed(false)
    let url: string | null = null
    try {
      const [{ pdf }, { MemorandumPdf, pdfFilename }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./MemorandumPdf"),
      ])
      const blob = await pdf(<MemorandumPdf memorandum={memorandum} />).toBlob()
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = pdfFilename(memorandum)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      setFailed(true)
    } finally {
      // Revoked on the next tick: revoking synchronously can cancel the
      // download in some browsers before it has started reading the blob.
      if (url) {
        const objectUrl = url
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
      }
      setBusy(false)
    }
  }

  const base =
    "inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
  const look =
    variant === "primary"
      ? "bg-coral hover:bg-coral-dark text-white"
      : "border border-sand text-navy hover:bg-cream"

  return (
    <div className="flex flex-col gap-1">
      <button onClick={handleDownload} disabled={busy} className={`${base} ${look}`}>
        {busy ? "Preparing…" : label}
      </button>
      {failed && (
        <span className="text-xs text-red-600">
          Could not build the PDF. Please try again.
        </span>
      )}
    </div>
  )
}

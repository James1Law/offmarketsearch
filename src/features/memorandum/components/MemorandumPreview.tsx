import type { Memorandum } from "@/types/memorandum"
import { renderMemorandum } from "../document"
import { Logo } from "@/components/logo"

/**
 * The document as the parties see it. Deliberately plain: this is meant to look
 * like paperwork a conveyancer would accept, not like a web page.
 */
export function MemorandumPreview({ memorandum }: { memorandum: Memorandum }) {
  const doc = renderMemorandum(memorandum)

  return (
    <article className="bg-white border border-sand rounded-xl shadow-sm overflow-hidden">
      <header className="bg-cream border-b border-sand px-5 sm:px-8 py-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-navy leading-tight">{doc.title}</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-coral-dark mt-1">
            {doc.subjectToContract}
          </p>
        </div>
        <Logo markClassName="w-6 h-6" textClassName="text-sm" />
      </header>

      <div className="px-5 sm:px-8 py-6 text-sm text-navy">
        {doc.pendingNote && (
          <p className="text-xs text-navy-soft bg-cream border border-sand rounded-lg px-3 py-2 mb-6">
            {doc.pendingNote}
          </p>
        )}

        <dl className="flex flex-col gap-6">
          {doc.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-soft/80 pb-1.5 mb-2 border-b border-sand">
                {section.heading}
              </h3>
              <div className="flex flex-col gap-1.5">
                {section.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[10rem_1fr] gap-3 items-baseline">
                    <dt className="text-xs text-navy-soft">{row.label}</dt>
                    <dd className="leading-relaxed whitespace-pre-wrap break-words">{row.value}</dd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </dl>

        {doc.acknowledgements.length > 0 && (
          <section className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-soft/80 pb-1.5 mb-3 border-b border-sand">
              Acknowledgements
            </h3>
            <div className="flex flex-col gap-4">
              {doc.acknowledgements.map((ack) => (
                <div key={ack.role} className="rounded-lg bg-cream border border-sand px-4 py-3">
                  <p className="text-xs font-semibold text-navy-soft">{ack.role}</p>
                  <p className="mt-1 leading-relaxed">{ack.sentence}</p>
                  <p className="text-xs text-navy-soft mt-2">
                    <span className="font-medium text-navy">{ack.typedName}</span> — {ack.when}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-8 pt-4 border-t border-sand flex flex-col gap-2">
          {doc.disclaimer.map((line) => (
            <p key={line} className="text-[11px] leading-relaxed text-navy-soft/70">
              {line}
            </p>
          ))}
        </footer>
      </div>
    </article>
  )
}

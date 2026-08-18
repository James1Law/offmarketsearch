import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { Memorandum } from "@/types/memorandum"
import { renderMemorandum } from "../document"

// ---------------------------------------------------------------------------
// The PDF both parties forward to their conveyancers.
//
// Built from the same renderMemorandum() output as the on-screen preview, so
// what someone acknowledged is what they download.
//
// Rendered in the browser, never on a server: generating it server-side would
// post the whole document to us and destroy the privacy property the URL
// fragment exists to provide. See docs/PLAN_MEMORANDUM_OF_SALE.md §7.
// ---------------------------------------------------------------------------

// Helvetica rather than the brand's Poppins: it is one of the standard PDF
// fonts, so it needs no embedding and adds nothing to the download.
const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, fontSize: 10, fontFamily: "Helvetica", color: "#1c2b3a" },
  header: { borderBottomWidth: 1, borderBottomColor: "#e5ddd3", paddingBottom: 12, marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subject: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#d1543a", marginTop: 4, letterSpacing: 1 },
  pending: { fontSize: 9, color: "#5a6b7d", backgroundColor: "#faf6f1", padding: 8, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionHeading: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: "#5a6b7d", letterSpacing: 1,
    borderBottomWidth: 1, borderBottomColor: "#e5ddd3", paddingBottom: 3, marginBottom: 6,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 130, color: "#5a6b7d", fontSize: 9 },
  value: { flex: 1, lineHeight: 1.4 },
  ackBox: { backgroundColor: "#faf6f1", borderWidth: 1, borderColor: "#e5ddd3", padding: 10, marginBottom: 8 },
  ackRole: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#5a6b7d", marginBottom: 3 },
  ackWhen: { fontSize: 9, color: "#5a6b7d", marginTop: 5 },
  ackName: { fontFamily: "Helvetica-Bold", color: "#1c2b3a" },
  footer: { marginTop: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e5ddd3" },
  disclaimer: { fontSize: 7.5, color: "#7b8794", lineHeight: 1.5, marginBottom: 4 },
  pageNumber: { position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", fontSize: 8, color: "#7b8794" },
})

export function MemorandumPdf({ memorandum }: { memorandum: Memorandum }) {
  const doc = renderMemorandum(memorandum)

  return (
    <Document title={`${doc.title} — ${memorandum.propertyAddress}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{doc.title}</Text>
          <Text style={styles.subject}>{doc.subjectToContract.toUpperCase()}</Text>
        </View>

        {doc.pendingNote && <Text style={styles.pending}>{doc.pendingNote}</Text>}

        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section} wrap={false}>
            <Text style={styles.sectionHeading}>{section.heading.toUpperCase()}</Text>
            {section.rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            ))}
          </View>
        ))}

        {doc.acknowledgements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>ACKNOWLEDGEMENTS</Text>
            {doc.acknowledgements.map((ack) => (
              <View key={ack.role} style={styles.ackBox} wrap={false}>
                <Text style={styles.ackRole}>{ack.role.toUpperCase()}</Text>
                <Text style={styles.value}>{ack.sentence}</Text>
                <Text style={styles.ackWhen}>
                  <Text style={styles.ackName}>{ack.typedName}</Text>
                  {` — ${ack.when}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {doc.disclaimer.map((line) => (
            <Text key={line} style={styles.disclaimer}>
              {line}
            </Text>
          ))}
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

/** Stable, descriptive filename — this lands in a conveyancer's inbox. */
export function pdfFilename(memorandum: Memorandum): string {
  const place = memorandum.propertyAddress
    .split(",")[0]
    ?.replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return `memorandum-of-sale-${place || "property"}.pdf`
}

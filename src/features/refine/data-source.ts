/**
 * Summarises where the property details on screen came from.
 *
 * Enrichment is per-address: some rows can come back from Chimnie while others
 * fall back to sample values. Reporting the whole screen as "Property data by
 * Chimnie" because one row matched overstates what we actually know, so a mixed
 * result says so explicitly.
 */
export function describeDataSource(liveCount: number, total: number): string {
  if (total === 0) return ""
  if (liveCount === 0) return "Sample data — not real property details"
  if (liveCount === total) return "Property data by Chimnie"
  return `${liveCount} of ${total} from Chimnie — the rest is sample data`
}

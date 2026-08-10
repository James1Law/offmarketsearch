import { z } from "zod"
import { NominatimResultSchema } from "@/types"

const BASE = "https://nominatim.openstreetmap.org"
const HEADERS = { "Accept-Language": "en-GB", "User-Agent": "offline.homes/1.0" }

export async function searchPlaces(query: string): Promise<z.infer<typeof NominatimResultSchema>[]> {
  if (!query.trim()) return []
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&countrycodes=gb&format=json&limit=5&addressdetails=0`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) return []
  const raw: unknown = await res.json()
  return z.array(NominatimResultSchema).parse(raw)
}

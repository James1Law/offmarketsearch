"use client"

import { useState, useCallback, useRef } from "react"
import type { NominatimResult } from "@/types"
import { searchPlaces } from "@/lib/geocoding/nominatim"

export function useNominatimSearch() {
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const found = await searchPlaces(query)
        setResults(found)
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  const clear = useCallback(() => setResults([]), [])

  return { results, loading, search, clear }
}

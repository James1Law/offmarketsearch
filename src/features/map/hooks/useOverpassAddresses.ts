"use client"

import { useState, useCallback } from "react"
import type { SelectedAddress } from "@/types"
import { fetchAddressesInBBox } from "@/lib/geocoding/overpass"

export interface BBox {
  south: number
  west: number
  north: number
  east: number
}

export function useOverpassAddresses() {
  const [addresses, setAddresses] = useState<SelectedAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (bbox: BBox) => {
    setLoading(true)
    setError(null)
    try {
      const found = await fetchAddressesInBBox(bbox)
      setAddresses(found)
    } catch {
      setError("Could not load addresses. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setAddresses([])
    setError(null)
  }, [])

  return { addresses, loading, error, fetch, clear }
}

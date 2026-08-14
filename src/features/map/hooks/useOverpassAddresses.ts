"use client"

import { useState, useCallback, useRef } from "react"
import type { SelectedAddress } from "@/types"
import {
  fetchAddressesInBBox,
  fetchAddressesInPolygon,
  type PolygonRing,
} from "@/lib/geocoding/overpass"

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
  // Guards against out-of-order responses (viewport fetches fire on every pan).
  const requestIdRef = useRef(0)

  const fetchPolygon = useCallback(async (ring: PolygonRing) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const found = await fetchAddressesInPolygon(ring)
      if (requestId !== requestIdRef.current) return
      setAddresses(found)
    } catch {
      if (requestId !== requestIdRef.current) return
      setError("Could not load addresses. Please try again.")
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [])

  // Silent update: keeps the previous results on screen until new ones arrive,
  // so panning doesn't flash a loading skeleton.
  const fetchViewport = useCallback(async (bbox: BBox) => {
    const requestId = ++requestIdRef.current
    try {
      const found = await fetchAddressesInBBox(bbox)
      if (requestId !== requestIdRef.current) return
      setAddresses(found)
      setError(null)
    } catch {
      // Viewport fetches fail quietly — the user didn't explicitly ask.
    }
  }, [])

  const clear = useCallback(() => {
    requestIdRef.current++
    setAddresses([])
    setError(null)
  }, [])

  return { addresses, loading, error, fetchPolygon, fetchViewport, clear }
}

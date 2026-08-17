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
  // "No addresses here" and "you haven't looked yet" are both an empty list,
  // but they need different words on screen, so track which one this is.
  const [searched, setSearched] = useState(false)
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
      setSearched(true)
    } catch {
      if (requestId !== requestIdRef.current) return
      setAddresses([])
      setSearched(true)
      setError("Could not reach the address service. Please try again.")
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
      setSearched(true)
      setError(null)
    } catch {
      // Viewport fetches fail quietly — the user didn't explicitly ask.
    }
  }, [])

  const clear = useCallback(() => {
    requestIdRef.current++
    setAddresses([])
    setSearched(false)
    setError(null)
  }, [])

  return { addresses, loading, error, searched, fetchPolygon, fetchViewport, clear }
}

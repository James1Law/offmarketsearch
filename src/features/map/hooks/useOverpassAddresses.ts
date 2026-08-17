"use client"

import { useState, useCallback, useRef } from "react"
import type { BBox, PolygonRing, SelectedAddress } from "@/types"
import { findAddressesInArea, findAddressesInViewport } from "../actions"

export function useOverpassAddresses() {
  const [addresses, setAddresses] = useState<SelectedAddress[]>([])
  const [totalFound, setTotalFound] = useState(0)
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
      const result = await findAddressesInArea(ring)
      if (requestId !== requestIdRef.current) return
      setAddresses(result.addresses)
      setTotalFound(result.totalFound)
      setSearched(true)
    } catch {
      if (requestId !== requestIdRef.current) return
      setAddresses([])
      setTotalFound(0)
      setSearched(true)
      setError("Could not reach the address service. Please try again in a moment.")
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [])

  // Silent update: keeps the previous results on screen until new ones arrive,
  // so panning doesn't flash a loading skeleton.
  const fetchViewport = useCallback(async (bbox: BBox) => {
    const requestId = ++requestIdRef.current
    try {
      const result = await findAddressesInViewport(bbox)
      if (requestId !== requestIdRef.current) return
      setAddresses(result.addresses)
      setTotalFound(result.totalFound)
      setSearched(true)
      setError(null)
    } catch {
      // Viewport fetches fail quietly — the user didn't explicitly ask.
    }
  }, [])

  const clear = useCallback(() => {
    requestIdRef.current++
    setAddresses([])
    setTotalFound(0)
    setSearched(false)
    setError(null)
  }, [])

  return { addresses, totalFound, loading, error, searched, fetchPolygon, fetchViewport, clear }
}

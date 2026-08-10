"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { env } from "@/lib/env"
import { MAP_DEFAULTS } from "@/lib/constants"
import type { SelectedAddress } from "@/types"
import type { BBox } from "../hooks/useOverpassAddresses"

interface FitPadding {
  top: number
  bottom: number
  left: number
  right: number
}

interface PropertyMapProps {
  addresses: SelectedAddress[]
  selectedIds: Set<string>
  drawMode: "idle" | "first-click" | "second-click"
  onDrawModeChange: (mode: "idle" | "first-click" | "second-click") => void
  onAreaDrawn: (bbox: BBox) => void
  /** When set, tapping a marker toggles it instead of opening a popup, and markers render larger for touch. */
  onMarkerTap?: (address: SelectedAddress) => void
  /** Hide the +/− navigation control (mobile uses pinch gestures). Default true. */
  showNavControl?: boolean
  /** Extra padding for the fit-to-area zoom, e.g. to keep results above a bottom sheet. */
  fitPadding?: FitPadding
}

const DEFAULT_FIT_PADDING: FitPadding = { top: 40, bottom: 40, left: 40, right: 40 }

function buildMapStyle(): string | object {
  if (env.NEXT_PUBLIC_MAPTILER_API_KEY) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${env.NEXT_PUBLIC_MAPTILER_API_KEY}`
  }
  return {
    version: 8,
    sources: {
      "carto-voyager": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> © <a href='https://carto.com/'>CARTO</a>",
        maxzoom: 20,
      },
    },
    layers: [{ id: "carto-voyager", type: "raster", source: "carto-voyager" }],
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  }
}

export function PropertyMap({
  addresses,
  selectedIds,
  drawMode,
  onDrawModeChange,
  onAreaDrawn,
  onMarkerTap,
  showNavControl = true,
  fitPadding = DEFAULT_FIT_PADDING,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const firstCornerRef = useRef<[number, number] | null>(null)
  const drawLayerAddedRef = useRef(false)

  // Stable refs so map event handlers always call the latest callbacks
  const drawModeRef = useRef(drawMode)
  const onAreaDrawnRef = useRef(onAreaDrawn)
  const onDrawModeChangeRef = useRef(onDrawModeChange)
  const onMarkerTapRef = useRef(onMarkerTap)
  const fitPaddingRef = useRef(fitPadding)

  useEffect(() => { drawModeRef.current = drawMode })
  useEffect(() => { onAreaDrawnRef.current = onAreaDrawn })
  useEffect(() => { onDrawModeChangeRef.current = onDrawModeChange })
  useEffect(() => { onMarkerTapRef.current = onMarkerTap })
  useEffect(() => { fitPaddingRef.current = fitPadding })

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle() as maplibregl.StyleSpecification | string,
      center: [MAP_DEFAULTS.CENTER_LNG, MAP_DEFAULTS.CENTER_LAT],
      zoom: MAP_DEFAULTS.ZOOM,
    })
    if (showNavControl) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    }
    mapRef.current = map

    map.on("load", () => {
      map.addSource("selection-rect", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: "selection-rect-fill",
        type: "fill",
        source: "selection-rect",
        paint: { "fill-color": "#f4795b", "fill-opacity": 0.12 },
      })
      map.addLayer({
        id: "selection-rect-line",
        type: "line",
        source: "selection-rect",
        paint: { "line-color": "#f4795b", "line-width": 2, "line-dasharray": [4, 2] },
      })
      drawLayerAddedRef.current = true
    })

    map.on("click", (e) => {
      const mode = drawModeRef.current
      if (mode === "first-click") {
        firstCornerRef.current = [e.lngLat.lng, e.lngLat.lat]
        onDrawModeChangeRef.current("second-click")
      } else if (mode === "second-click" && firstCornerRef.current) {
        const [lng1, lat1] = firstCornerRef.current
        const lng2 = e.lngLat.lng
        const lat2 = e.lngLat.lat
        const bbox: BBox = {
          south: Math.min(lat1, lat2),
          west: Math.min(lng1, lng2),
          north: Math.max(lat1, lat2),
          east: Math.max(lng1, lng2),
        }
        drawRect(map, bbox, fitPaddingRef.current)
        firstCornerRef.current = null
        onDrawModeChangeRef.current("idle")
        onAreaDrawnRef.current(bbox)
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
      drawLayerAddedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update cursor based on draw mode
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const canvas = map.getCanvas()
    canvas.style.cursor = drawMode !== "idle" ? "crosshair" : ""
  }, [drawMode])

  // Sync markers with addresses
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const touchMarkers = Boolean(onMarkerTap)
    for (const m of markersRef.current) m.remove()
    markersRef.current = addresses.map((addr) => {
      const el = document.createElement("div")
      const size = touchMarkers ? "w-6 h-6 border-[3px]" : "w-3 h-3 border-2"
      el.className = `${size} rounded-full border-white shadow-md transition-colors cursor-pointer ${
        selectedIds.has(addr.id) ? "bg-coral" : "bg-navy-soft"
      }`
      const marker = new maplibregl.Marker({ element: el }).setLngLat([addr.lng, addr.lat])
      if (touchMarkers) {
        el.addEventListener("click", () => {
          if (drawModeRef.current !== "idle") return
          onMarkerTapRef.current?.(addr)
        })
      } else {
        marker.setPopup(new maplibregl.Popup({ offset: 12 }).setText(addr.displayAddress))
      }
      return marker.addTo(map)
    })
  }, [addresses, selectedIds, onMarkerTap])

  return <div ref={containerRef} className="w-full h-full" />
}

function drawRect(map: maplibregl.Map, bbox: BBox, padding: FitPadding) {
  const src = map.getSource("selection-rect") as maplibregl.GeoJSONSource | undefined
  if (!src) return
  src.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [bbox.west, bbox.south],
              [bbox.east, bbox.south],
              [bbox.east, bbox.north],
              [bbox.west, bbox.north],
              [bbox.west, bbox.south],
            ],
          ],
        },
      },
    ],
  })
  map.fitBounds(
    [
      [bbox.west, bbox.south],
      [bbox.east, bbox.north],
    ],
    { padding, maxZoom: 17 },
  )
}

"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { env } from "@/lib/env"
import { MAP_DEFAULTS } from "@/lib/constants"
import type { SelectedAddress } from "@/types"
import type { BBox } from "../hooks/useOverpassAddresses"

interface PropertyMapProps {
  addresses: SelectedAddress[]
  selectedIds: Set<string>
  drawMode: "idle" | "first-click" | "second-click"
  onDrawModeChange: (mode: "idle" | "first-click" | "second-click") => void
  onAreaDrawn: (bbox: BBox) => void
}

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

  useEffect(() => { drawModeRef.current = drawMode })
  useEffect(() => { onAreaDrawnRef.current = onAreaDrawn })
  useEffect(() => { onDrawModeChangeRef.current = onDrawModeChange })

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle() as maplibregl.StyleSpecification | string,
      center: [MAP_DEFAULTS.CENTER_LNG, MAP_DEFAULTS.CENTER_LAT],
      zoom: MAP_DEFAULTS.ZOOM,
    })
    map.addControl(new maplibregl.NavigationControl(), "top-right")
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
        drawRect(map, bbox)
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
    for (const m of markersRef.current) m.remove()
    markersRef.current = addresses.map((addr) => {
      const el = document.createElement("div")
      el.className = `w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors ${
        selectedIds.has(addr.id) ? "bg-coral" : "bg-navy-soft"
      }`
      return new maplibregl.Marker({ element: el })
        .setLngLat([addr.lng, addr.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(addr.displayAddress))
        .addTo(map)
    })
  }, [addresses, selectedIds])

  return <div ref={containerRef} className="w-full h-full" />
}

function drawRect(map: maplibregl.Map, bbox: BBox) {
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
    { padding: 40, maxZoom: 17 },
  )
}

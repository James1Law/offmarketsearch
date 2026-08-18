"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { env } from "@/lib/env"
import { MAP_DEFAULTS } from "@/lib/constants"
import type { BBox, NominatimResult, SelectedAddress } from "@/types"
import { circleAreaToRing, type CircleArea } from "../area-select"

const CIRCLE_SOURCE = "area-circle"

interface PropertyMapProps {
  addresses: SelectedAddress[]
  selectedIds: Set<string>
  /** Tapping/clicking a pin toggles its selection on all devices. */
  onToggle: (address: SelectedAddress) => void
  /** The circle being placed, or null before the user has tapped anywhere. */
  circle: CircleArea | null
  /** Called with the tapped point, which becomes the circle's centre. */
  onCircleCenterChange: (center: [lng: number, lat: number]) => void
  /** Debounced notification of the current viewport after the user pans/zooms. */
  onViewportChange?: (bbox: BBox, zoom: number) => void
  /** Larger pins for touch devices. Default false. */
  touchTargets?: boolean
  /** Hide the +/− navigation control (mobile uses pinch gestures). Default true. */
  showNavControl?: boolean
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

function buildSatelliteSource(): maplibregl.RasterSourceSpecification {
  if (env.NEXT_PUBLIC_MAPTILER_API_KEY) {
    return {
      type: "raster",
      tiles: [
        `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: "© <a href='https://www.maptiler.com/copyright/'>MapTiler</a>",
    }
  }
  return {
    type: "raster",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: "© Esri, Maxar, Earthstar Geographics",
  }
}

export function PropertyMap({
  addresses,
  selectedIds,
  onToggle,
  circle,
  onCircleCenterChange,
  onViewportChange,
  touchTargets = false,
  showNavControl = true,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [satellite, setSatellite] = useState(false)

  // Stable refs so map event handlers always call the latest callbacks
  const onCircleCenterChangeRef = useRef(onCircleCenterChange)
  const onToggleRef = useRef(onToggle)
  const onViewportChangeRef = useRef(onViewportChange)

  useEffect(() => { onCircleCenterChangeRef.current = onCircleCenterChange })
  useEffect(() => { onToggleRef.current = onToggle })
  useEffect(() => { onViewportChangeRef.current = onViewportChange })

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
      map.addSource("satellite", buildSatelliteSource())
      map.addLayer({ id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } })

      // Circle overlay. Added after satellite so it draws on top of imagery.
      map.addSource(CIRCLE_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })
      map.addLayer({
        id: `${CIRCLE_SOURCE}-fill`,
        type: "fill",
        source: CIRCLE_SOURCE,
        paint: { "fill-color": "#f4795b", "fill-opacity": 0.12 },
      })
      map.addLayer({
        id: `${CIRCLE_SOURCE}-outline`,
        type: "line",
        source: CIRCLE_SOURCE,
        paint: { "line-color": "#f4795b", "line-width": 2 },
      })

      setMapReady(true)
    })

    map.on("click", (e) => {
      onCircleCenterChangeRef.current([e.lngLat.lng, e.lngLat.lat])
    })

    map.on("moveend", () => {
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
      viewportTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds()
        onViewportChangeRef.current?.(
          {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
          },
          map.getZoom(),
        )
      }, MAP_DEFAULTS.VIEWPORT_DEBOUNCE_MS)
    })

    function handleSearchSelect(e: Event) {
      const result = (e as CustomEvent<NominatimResult>).detail
      const lng = Number(result.lon)
      const lat = Number(result.lat)
      if (Number.isNaN(lng) || Number.isNaN(lat)) return
      map.flyTo({ center: [lng, lat], zoom: MAP_DEFAULTS.PIN_ZOOM })
    }
    window.addEventListener("nominatim-select", handleSearchSelect)

    return () => {
      window.removeEventListener("nominatim-select", handleSearchSelect)
      if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current)
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Draw the circle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const source = map.getSource<maplibregl.GeoJSONSource>(CIRCLE_SOURCE)
    if (!source) return

    if (!circle) {
      source.setData({ type: "FeatureCollection", features: [] })
      return
    }
    source.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [circleAreaToRing(circle)] },
    })
  }, [circle, mapReady])

  // Crosshair everywhere, so the map always reads as "tap to search here"
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.getCanvas().style.cursor = "crosshair"
  }, [mapReady])

  // Toggle satellite imagery
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    map.setLayoutProperty("satellite", "visibility", satellite ? "visible" : "none")
  }, [satellite, mapReady])

  // Sync markers with addresses
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const m of markersRef.current) m.remove()
    markersRef.current = addresses.map((addr) => {
      const el = document.createElement("div")
      const size = touchTargets ? "w-6 h-6 border-[3px]" : "w-3.5 h-3.5 border-2"
      el.className = `${size} rounded-full border-white shadow-md transition-colors cursor-pointer ${
        selectedIds.has(addr.id) ? "bg-coral" : "bg-navy-soft"
      }`
      el.title = addr.displayAddress
      el.addEventListener("click", (event) => {
        // Don't let the map's own click handler also move the circle.
        event.stopPropagation()
        onToggleRef.current(addr)
      })
      return new maplibregl.Marker({ element: el }).setLngLat([addr.lng, addr.lat]).addTo(map)
    })
  }, [addresses, selectedIds, touchTargets])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={() => setSatellite((s) => !s)}
        className="absolute top-2 left-2 z-10 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/95 text-navy shadow-md border border-sand hover:bg-cream transition-colors"
        aria-pressed={satellite}
      >
        {satellite ? "Map view" : "Satellite"}
      </button>
    </div>
  )
}

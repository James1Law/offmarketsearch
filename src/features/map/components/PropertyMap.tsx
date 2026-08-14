"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { TerraDraw, TerraDrawPolygonMode } from "terra-draw"
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter"
import { env } from "@/lib/env"
import { MAP_DEFAULTS } from "@/lib/constants"
import type { SelectedAddress, NominatimResult } from "@/types"
import type { PolygonRing } from "@/lib/geocoding/overpass"
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
  /** Tapping/clicking a pin toggles its selection on all devices. */
  onToggle: (address: SelectedAddress) => void
  /** Whether polygon drawing mode is active. */
  drawing: boolean
  /** Called when drawing ends from within the map (polygon completed). */
  onDrawingChange: (drawing: boolean) => void
  /** Called with the completed polygon ring as [lng, lat] tuples. */
  onPolygonComplete: (ring: PolygonRing) => void
  /** Debounced notification of the current viewport after the user pans/zooms. */
  onViewportChange?: (bbox: BBox, zoom: number) => void
  /** Larger pins for touch devices. Default false. */
  touchTargets?: boolean
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
  drawing,
  onDrawingChange,
  onPolygonComplete,
  onViewportChange,
  touchTargets = false,
  showNavControl = true,
  fitPadding = DEFAULT_FIT_PADDING,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [satellite, setSatellite] = useState(false)

  // Stable refs so map event handlers always call the latest callbacks
  const drawingRef = useRef(drawing)
  const onToggleRef = useRef(onToggle)
  const onDrawingChangeRef = useRef(onDrawingChange)
  const onPolygonCompleteRef = useRef(onPolygonComplete)
  const onViewportChangeRef = useRef(onViewportChange)
  const fitPaddingRef = useRef(fitPadding)

  useEffect(() => { drawingRef.current = drawing })
  useEffect(() => { onToggleRef.current = onToggle })
  useEffect(() => { onDrawingChangeRef.current = onDrawingChange })
  useEffect(() => { onPolygonCompleteRef.current = onPolygonComplete })
  useEffect(() => { onViewportChangeRef.current = onViewportChange })
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
      map.addSource("satellite", buildSatelliteSource())
      map.addLayer({ id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } })

      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({
            styles: {
              fillColor: "#f4795b",
              fillOpacity: 0.12,
              outlineColor: "#f4795b",
              outlineWidth: 2,
              closingPointColor: "#f4795b",
              closingPointWidth: 7,
              closingPointOutlineColor: "#ffffff",
              closingPointOutlineWidth: 2,
            },
          }),
        ],
      })
      draw.start()
      draw.setMode("static")
      draw.on("finish", (id, context) => {
        if (context.action !== "draw") return
        const feature = draw.getSnapshotFeature(id)
        if (!feature || feature.geometry.type !== "Polygon") return
        const positions = feature.geometry.coordinates[0] ?? []
        const ring: PolygonRing = positions
          .map((p): [number, number] | null => {
            const lng = p[0]
            const lat = p[1]
            return lng !== undefined && lat !== undefined ? [lng, lat] : null
          })
          .filter((p): p is [number, number] => p !== null)
        if (ring.length < 4) return
        // Leave drawing mode but keep the finished polygon rendered.
        draw.setMode("static")
        const lngs = ring.map(([lng]) => lng)
        const lats = ring.map(([, lat]) => lat)
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: fitPaddingRef.current, maxZoom: 17 },
          // Flag so the moveend handler doesn't fire a viewport fetch that
          // would overwrite the polygon results.
          { programmatic: true },
        )
        onDrawingChangeRef.current(false)
        onPolygonCompleteRef.current(ring)
      })
      drawRef.current = draw
      setMapReady(true)
    })

    map.on("moveend", (e) => {
      if ((e as { programmatic?: boolean }).programmatic) return
      if (drawingRef.current) return
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
      drawRef.current?.stop()
      drawRef.current = null
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Enter/leave polygon drawing mode
  useEffect(() => {
    const draw = drawRef.current
    if (!draw || !mapReady) return
    if (drawing) {
      draw.clear()
      draw.setMode("polygon")
    } else if (draw.getMode() === "polygon") {
      // Cancelled mid-draw: drop the partial sketch. (A completed polygon
      // already switched to static in the finish handler, so it's kept.)
      draw.setMode("static")
      draw.clear()
    }
  }, [drawing, mapReady])

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
      el.addEventListener("click", () => {
        if (drawingRef.current) return
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

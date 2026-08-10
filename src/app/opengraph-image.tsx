import { ImageResponse } from "next/og"

export const alt = "Offline.homes — Write to homeowners near you"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf3e7",
          gap: 36,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="130" height="130" viewBox="0 0 100 100" fill="none">
            <rect x="70" y="6" width="12" height="34" rx="3" fill="#f37a58" />
            <path d="M10.5 42V79a10.5 10.5 0 0 0 10.5 10.5h58A10.5 10.5 0 0 0 89.5 79V42" fill="#faf2ed" stroke="#f37a58" strokeWidth="10" />
            <rect x="11" y="46" width="78" height="44" rx="8" fill="#f9cf9a" />
            <path d="M11 46 50 88 11 88Z" fill="rgba(255,255,255,0.26)" />
            <path d="M89 46 50 88 89 88Z" fill="rgba(255,255,255,0.14)" />
            <path d="M11 90 50 62 89 90Z" fill="rgba(255,255,255,0.18)" />
            <path d="M59.32 24.07 77.68 41.93Q87 51 77.68 60.07L59.32 77.93Q50 87 40.68 77.93L22.32 60.07Q13 51 22.32 41.93L40.68 24.07Q50 15 59.32 24.07Z" fill="#faf2ed" stroke="#f37a58" strokeWidth="10" />
            <path d="M7 47 50 8l43 39" stroke="#f37a58" strokeWidth="12.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, color: "#101a3c", letterSpacing: -3 }}>
            Offline<span style={{ color: "#f4795b" }}>.</span>homes
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#4a5370" }}>
          Write to homeowners before their house hits the market
        </div>
      </div>
    ),
    size
  )
}

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
          <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
            <rect x="44.5" y="7" width="9" height="14" rx="2" fill="#f4795b" />
            <path
              d="M32 5.5 6.5 26.5V52a5.5 5.5 0 0 0 5.5 5.5h40a5.5 5.5 0 0 0 5.5-5.5V26.5Z"
              fill="#fbf1ea"
              stroke="#f4795b"
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            <rect x="9.5" y="33.5" width="45" height="21" rx="3" fill="#f9d2a0" stroke="#f4795b" strokeWidth="4" strokeLinejoin="round" />
            <path d="M32 16 53 34 32 52 11 34Z" fill="#fbf1ea" stroke="#f4795b" strokeWidth="4.5" strokeLinejoin="round" />
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

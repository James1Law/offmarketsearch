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
            <rect x="72" y="12" width="10" height="32" rx="3" fill="#f4795b" />
            <path d="M14.5 44V82a9.5 9.5 0 0 0 9.5 9.5h52a9.5 9.5 0 0 0 9.5-9.5V44" fill="#faf2ed" stroke="#f4795b" strokeWidth="9.5" />
            <rect x="15" y="48" width="70" height="43" rx="7" fill="#f9d2a0" />
            <path d="M15 48 50 86 15 86Z" fill="rgba(255,255,255,0.22)" />
            <path d="M85 48 50 86 85 86Z" fill="rgba(255,255,255,0.12)" />
            <path
              d="M55.66 21.66 78.34 44.34Q84 50 78.34 55.66L55.66 78.34Q50 84 44.34 78.34L21.66 55.66Q16 50 21.66 44.34L44.34 21.66Q50 16 55.66 21.66Z"
              fill="#faf2ed"
              stroke="#f4795b"
              strokeWidth="8.5"
            />
            <path d="M8 51 50 9l42 42" stroke="#f4795b" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
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

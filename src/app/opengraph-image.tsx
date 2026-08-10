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
            <path d="M45 9h7v11h-7z" fill="#f4795b" />
            <path
              d="M32 6.5 6.5 26.5V52a5.5 5.5 0 0 0 5.5 5.5h40a5.5 5.5 0 0 0 5.5-5.5V26.5Z"
              fill="#fdf2ec"
              stroke="#f4795b"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M14 33h36v19H14Z" fill="#fbd9ae" stroke="#f4795b" strokeWidth="4" strokeLinejoin="round" />
            <path d="M32 13 50 33 32 47 14 33Z" fill="#fdf2ec" stroke="#f4795b" strokeWidth="4" strokeLinejoin="round" />
            <path d="M14 52 30 41.5M50 52 34 41.5" stroke="#f4795b" strokeWidth="4" strokeLinecap="round" />
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

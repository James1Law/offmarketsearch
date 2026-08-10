import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf3e7",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
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
      </div>
    ),
    size
  )
}

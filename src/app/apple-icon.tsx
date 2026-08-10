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
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
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
      </div>
    ),
    size
  )
}

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
      </div>
    ),
    size
  )
}

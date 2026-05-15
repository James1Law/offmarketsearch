import { NextResponse, type NextRequest } from "next/server"

const MOBILE_UA_REGEX = /Mobile|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i

const DESKTOP_TO_MOBILE: Record<string, string> = {
  "/": "/m",
  "/map": "/m/map",
  "/letter": "/m/letter",
  "/basket": "/m/basket",
  "/confirm": "/m/confirm",
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Escape hatch: ?desktop=1 disables the redirect for this navigation.
  if (req.nextUrl.searchParams.has("desktop")) return NextResponse.next()

  const target = DESKTOP_TO_MOBILE[pathname]
  if (!target) return NextResponse.next()

  const ua = req.headers.get("user-agent") ?? ""
  if (!MOBILE_UA_REGEX.test(ua)) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = target
  url.search = search
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/", "/map", "/letter", "/basket", "/confirm"],
}

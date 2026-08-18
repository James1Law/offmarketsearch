import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount between tests so a leaked component from one test cannot satisfy a
// query in the next.
afterEach(cleanup)

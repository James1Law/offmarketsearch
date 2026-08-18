import { describe, it, expect } from "vitest"
import { describeDataSource } from "./data-source"

describe("describeDataSource", () => {
  it("credits Chimnie only when every row came from Chimnie", () => {
    expect(describeDataSource(4, 4)).toBe("Property data by Chimnie")
  })

  it("says plainly when nothing is real", () => {
    expect(describeDataSource(0, 12)).toBe("Sample data — not real property details")
  })

  // The case the old liveCount > 0 check got wrong: one real row among many
  // used to label the whole screen as Chimnie data.
  it("does not let a single live row speak for the rest", () => {
    expect(describeDataSource(1, 30)).toBe("1 of 30 from Chimnie — the rest is sample data")
  })

  it("says nothing when there are no properties", () => {
    expect(describeDataSource(0, 0)).toBe("")
  })
})

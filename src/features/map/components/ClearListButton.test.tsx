import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClearListButton } from "./ClearListButton"
import { campaignStore } from "@/lib/campaign-store"

describe("ClearListButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders nothing when the list is empty", () => {
    const { container } = render(<ClearListButton count={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  // Clearing throws away work, so one stray tap must not do it.
  it("asks before clearing", async () => {
    const clear = vi.spyOn(campaignStore, "clear").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ClearListButton count={12} />)

    await user.click(screen.getByRole("button", { name: "Clear" }))

    expect(clear).not.toHaveBeenCalled()
    expect(screen.getByText("Clear all 12?")).toBeInTheDocument()
  })

  it("clears once confirmed", async () => {
    const clear = vi.spyOn(campaignStore, "clear").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ClearListButton count={12} />)

    await user.click(screen.getByRole("button", { name: "Clear" }))
    await user.click(screen.getByRole("button", { name: "Yes" }))

    expect(clear).toHaveBeenCalledOnce()
  })

  it("backs out without clearing, and can be asked again", async () => {
    const clear = vi.spyOn(campaignStore, "clear").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ClearListButton count={3} />)

    await user.click(screen.getByRole("button", { name: "Clear" }))
    await user.click(screen.getByRole("button", { name: "No" }))

    expect(clear).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument()
  })
})

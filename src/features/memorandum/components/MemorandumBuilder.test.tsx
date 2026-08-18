import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemorandumBuilder } from "./MemorandumBuilder"

// next/link renders fine in jsdom, but the PDF renderer is a megabyte of
// canvas-adjacent code that has no business loading in a unit test.
vi.mock("./DownloadPdfButton", () => ({
  DownloadPdfButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Download PDF"}</button>
  ),
}))

async function fillMinimum(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Property address"), "14 Athelstan Road, Puddletown")
  await user.type(screen.getByLabelText("Agreed price"), "485000")

  const sellerFields = within(screen.getByRole("group", { name: /^Seller$/ }))
  await user.type(sellerFields.getByLabelText("Full name"), "William Boltwood")

  const buyerFields = within(screen.getByRole("group", { name: /^Buyer$/ }))
  await user.type(buyerFields.getByLabelText("Full name"), "James Law")
}

describe("MemorandumBuilder", () => {
  it("waits for the essentials before showing a document", () => {
    render(<MemorandumBuilder />)
    expect(screen.getByText("Your memorandum will appear here")).toBeInTheDocument()
  })

  it("names what is still missing rather than just refusing", async () => {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)

    await user.type(screen.getByLabelText("Property address"), "14 Athelstan Road")

    expect(
      screen.getByText(/Still needed: the agreed price, the seller's name and the buyer's name/),
    ).toBeInTheDocument()
  })

  it("shows the document once the essentials are in", async () => {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)
    await fillMinimum(user)

    expect(screen.getByRole("heading", { name: "Memorandum of Sale" })).toBeInTheDocument()
    expect(screen.getByText("£485,000")).toBeInTheDocument()
  })

  it("marks the document subject to contract from the start", async () => {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)
    await fillMinimum(user)

    expect(screen.getByText("Subject to contract")).toBeInTheDocument()
  })

  // The buyer's side is theirs to fill in; the seller should not be able to
  // put words in their mouth about their own conveyancer or position.
  it("leaves the buyer's own details for the buyer", async () => {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)
    await fillMinimum(user)

    const buyerConveyancer = within(screen.getByRole("group", { name: "Buyer's conveyancer" }))
    expect(buyerConveyancer.queryByRole("textbox", { name: "Firm" })).not.toBeInTheDocument()
    expect(buyerConveyancer.getByText("The buyer adds this when they confirm")).toBeInTheDocument()
  })

  it("keeps the seller in charge of what is included", async () => {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)
    await fillMinimum(user)

    await user.type(screen.getByLabelText("Excluded"), "The greenhouse and the water butt.")

    // Scoped to the rendered document: an unscoped query also matches the
    // textarea the text was just typed into.
    const document_ = within(screen.getByRole("article"))
    expect(document_.getByText("The greenhouse and the water butt.")).toBeInTheDocument()
    expect(document_.getByText("Excluded from the sale")).toBeInTheDocument()
  })
})

describe("acknowledging as the seller", () => {
  async function fillAndReachAcknowledgement() {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)
    await fillMinimum(user)
    return user
  }

  it("will not let an incomplete document be confirmed", async () => {
    const user = userEvent.setup()
    render(<MemorandumBuilder />)

    await user.type(screen.getByLabelText("Your full name"), "William Boltwood")
    await user.click(screen.getByRole("checkbox"))

    expect(screen.getByRole("button", { name: "Confirm and continue" })).toBeDisabled()
  })

  it("needs both the typed name and the tick", async () => {
    const user = await fillAndReachAcknowledgement()
    const confirm = screen.getByRole("button", { name: "Confirm and continue" })

    await user.type(screen.getByLabelText("Your full name"), "William Boltwood")
    expect(confirm).toBeDisabled()

    await user.click(screen.getByRole("checkbox"))
    expect(confirm).toBeEnabled()
  })

  it("shows the declaration in the signer's own words", async () => {
    const user = await fillAndReachAcknowledgement()
    await user.type(screen.getByLabelText("Your full name"), "Will Boltwood")

    expect(
      screen.getByText(/agree to the terms of the sale as outlined within this document/),
    ).toBeInTheDocument()
  })

  // A hard match would reject "Will" against "William", which is wrong more
  // often than it is right.
  it("points out a name mismatch without blocking it", async () => {
    const user = await fillAndReachAcknowledgement()
    await user.type(screen.getByLabelText("Your full name"), "Will Boltwood")

    expect(screen.getByText(/does not match the name given above/)).toBeInTheDocument()
    await user.click(screen.getByRole("checkbox"))
    expect(screen.getByRole("button", { name: "Confirm and continue" })).toBeEnabled()
  })

  it("accepts a name that differs only in spacing or case", async () => {
    const user = await fillAndReachAcknowledgement()
    await user.type(screen.getByLabelText("Your full name"), "  william   BOLTWOOD ")

    expect(screen.queryByText(/does not match the name given above/)).not.toBeInTheDocument()
  })

  it("hands over the link once confirmed, with the download offered first", async () => {
    const user = await fillAndReachAcknowledgement()
    await user.type(screen.getByLabelText("Your full name"), "William Boltwood")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Confirm and continue" }))

    expect(await screen.findByText("1. Keep a copy for yourself")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Download your copy" })).toBeInTheDocument()
    expect(screen.getByText("2. Send this link")).toBeInTheDocument()
  })

  it("records the acknowledgement on the document itself", async () => {
    const user = await fillAndReachAcknowledgement()
    await user.type(screen.getByLabelText("Your full name"), "William Boltwood")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Confirm and continue" }))

    expect(
      await screen.findByText(
        "I, William Boltwood, agree to the terms of the sale as outlined within this document.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("The buyer has not yet acknowledged these terms.")).toBeInTheDocument()
  })

  it("builds a share link pointing at the confirm route", async () => {
    const user = await fillAndReachAcknowledgement()
    await user.type(screen.getByLabelText("Your full name"), "William Boltwood")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Confirm and continue" }))

    const field = await screen.findByDisplayValue(/\/memorandum\/confirm#v1\./)
    expect(field).toBeInTheDocument()
  })
})

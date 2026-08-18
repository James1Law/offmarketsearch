import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemorandumConfirm } from "./MemorandumConfirm"
import { encodeMemorandum } from "../share-link"
import { memorandumFromDraft, emptyDraft } from "@/types/memorandum"
import type { Memorandum } from "@/types/memorandum"

vi.mock("./DownloadPdfButton", () => ({
  DownloadPdfButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? "Download PDF"}</button>
  ),
}))

const SELLER_ACK = { typedName: "William Boltwood", at: "2026-08-18T09:23:41.000Z" }
const BUYER_ACK = { typedName: "James Law", at: "2026-08-18T14:02:11.000Z" }

function sellerSent(
  acks: { seller?: typeof SELLER_ACK; buyer?: typeof BUYER_ACK } = { seller: SELLER_ACK },
): Memorandum {
  const result = memorandumFromDraft(
    {
      ...emptyDraft(),
      propertyAddress: "14 Athelstan Road, Puddletown",
      postcode: "DT2 8SL",
      price: "485000",
      seller: { name: "William Boltwood", email: "will@example.co.uk", phone: "", address: "" },
      buyer: { name: "James Law", email: "", phone: "", address: "" },
      inclusions: "All fixtures and fittings.",
      exclusions: "The greenhouse and the water butt.",
      sellerChain: "found-a-property",
    },
    acks,
  )
  if (!result.success) throw new Error("fixture is not a valid memorandum")
  return result.data
}

async function openWith(memorandum: Memorandum) {
  window.location.hash = await encodeMemorandum(memorandum)
  return render(<MemorandumConfirm />)
}

beforeEach(() => {
  window.location.hash = ""
})

afterEach(() => {
  window.location.hash = ""
})

describe("opening a link that does not work", () => {
  it.each([
    ["no link at all", ""],
    ["a link from a newer version", "#v9.abcdef"],
    ["a link cut in half by a messaging app", "#v1.H4sIAAAAAAAA"],
  ])("explains %s and offers a way forward", async (_label, hash) => {
    window.location.hash = hash
    render(<MemorandumConfirm />)

    expect(await screen.findByText("This link didn't open")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start a memorandum of sale" })).toBeInTheDocument()
  })

  it("says a truncated link is probably truncated", async () => {
    const fragment = await encodeMemorandum(sellerSent())
    window.location.hash = fragment.slice(0, fragment.length - 24)
    render(<MemorandumConfirm />)

    expect(await screen.findByText(/messaging apps sometimes cut long links in half/)).toBeInTheDocument()
  })
})

describe("the buyer's view", () => {
  it("greets the buyer by naming who sent it", async () => {
    await openWith(sellerSent())

    expect(
      await screen.findByText("William Boltwood has sent you a memorandum of sale"),
    ).toBeInTheDocument()
  })

  it("carries the seller's terms across the link intact", async () => {
    await openWith(sellerSent())
    await screen.findByRole("article")

    const doc = within(screen.getByRole("article"))
    expect(doc.getByText("£485,000")).toBeInTheDocument()
    expect(doc.getByText("All fixtures and fittings.")).toBeInTheDocument()
    expect(doc.getByText("The greenhouse and the water butt.")).toBeInTheDocument()
    expect(doc.getByText("Found a property to buy")).toBeInTheDocument()
  })

  it("shows the seller's acknowledgement already recorded", async () => {
    await openWith(sellerSent())

    expect(
      await screen.findByText(
        "I, William Boltwood, agree to the terms of the sale as outlined within this document.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("The buyer has not yet acknowledged these terms.")).toBeInTheDocument()
  })

  // The seller sets the terms; the buyer confirms them or goes back and talks.
  it("will not let the buyer edit the seller's terms", async () => {
    await openWith(sellerSent())
    await screen.findByRole("article")

    expect(screen.queryByRole("textbox", { name: "Included" })).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Property address" })).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Agreed price" })).not.toBeInTheDocument()
  })

  it("lets the buyer fill in their own side", async () => {
    await openWith(sellerSent())
    await screen.findByRole("article")

    const buyerConveyancer = within(screen.getByRole("group", { name: "Buyer's conveyancer" }))
    expect(buyerConveyancer.getByRole("textbox", { name: "Firm" })).toBeEnabled()

    const sellerConveyancer = within(screen.getByRole("group", { name: "Seller's conveyancer" }))
    expect(sellerConveyancer.queryByRole("textbox", { name: "Firm" })).not.toBeInTheDocument()
  })
})

describe("completing the memorandum", () => {
  it("records both acknowledgements and offers the return link", async () => {
    const user = userEvent.setup()
    await openWith(sellerSent())
    await screen.findByRole("article")

    const buyerConveyancer = within(screen.getByRole("group", { name: "Buyer's conveyancer" }))
    await user.type(buyerConveyancer.getByRole("textbox", { name: "Firm" }), "Thornton Jones")

    await user.type(screen.getByLabelText("Your full name"), "James Law")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Confirm and finish" }))

    expect(await screen.findByText("Confirmed — send it back to the seller")).toBeInTheDocument()

    const doc = within(screen.getByRole("article"))
    expect(
      doc.getByText("I, James Law, agree to the terms of the sale as outlined within this document."),
    ).toBeInTheDocument()
    expect(
      doc.getByText(
        "I, William Boltwood, agree to the terms of the sale as outlined within this document.",
      ),
    ).toBeInTheDocument()
    expect(doc.queryByText(/has not yet acknowledged/)).not.toBeInTheDocument()
  })

  it("keeps what the buyer added", async () => {
    const user = userEvent.setup()
    await openWith(sellerSent())
    await screen.findByRole("article")

    const buyerConveyancer = within(screen.getByRole("group", { name: "Buyer's conveyancer" }))
    await user.type(buyerConveyancer.getByRole("textbox", { name: "Firm" }), "Thornton Jones")

    await user.type(screen.getByLabelText("Your full name"), "James Law")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: "Confirm and finish" }))

    const doc = within(await screen.findByRole("article"))
    expect(doc.getByText("Thornton Jones")).toBeInTheDocument()
  })
})

describe("reopening a finished memorandum", () => {
  it("goes straight to the download for whoever opens it", async () => {
    await openWith(sellerSent({ seller: SELLER_ACK, buyer: BUYER_ACK }))

    expect(await screen.findByText("Both parties have confirmed")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Download the memorandum" })).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })
})

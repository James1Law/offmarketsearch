/**
 * Copy for /sell, kept as data so it can be edited in one place rather than
 * picked out of JSX. Wording is Will's, lightly punctuated for the web.
 */

export interface SellStep {
  number: number
  title: string
  body: readonly string[]
}

export interface SellSection {
  id: string
  heading: string | null
  steps: readonly SellStep[]
}

export const SELL_INTRO = {
  eyebrow: "Someone has contacted you about buying your home",
  heading: "You don't need an estate agent",
  standfirst:
    "If you've found a buyer directly, you can negotiate the sale yourself and use a conveyancer to handle the legal process. Here's how a private sale works, start to finish.",
} as const

export const SELL_SECTIONS: readonly SellSection[] = [
  {
    id: "before-you-decide",
    heading: null,
    steps: [
      {
        number: 1,
        title: "Arrange a viewing",
        body: [
          "Contact the prospective buyer to arrange a convenient time for them to view the property. You can show them around yourself and answer any questions they have about the property.",
        ],
      },
      {
        number: 2,
        title: "Get an independent valuation",
        body: [
          "Let them go away and think about whether they wish to make you an offer. In the meantime, obtain an independent valuation of your property so you have a clear understanding of its current market value and to act as a basis for your negotiations.",
        ],
      },
      {
        number: 3,
        title: "Arrange an EPC",
        body: [
          "If you decide to sell, make sure the property has a valid Energy Performance Certificate (EPC). An EPC is required when marketing a property for sale in England and Wales.",
        ],
      },
    ],
  },
  {
    id: "once-agreed",
    heading: "Once you've agreed to sell",
    steps: [
      {
        number: 4,
        title: "Agree the price and basic terms",
        body: [
          "Agree the sale price with the buyer and confirm what is included in the sale, such as fixtures, fittings and appliances.",
        ],
      },
      {
        number: 5,
        title: "Create a memorandum of sale",
        body: [
          "Prepare a simple document confirming the property address, agreed price, buyer and seller details, and the basic terms of the sale. Send it to both parties and their conveyancers.",
        ],
      },
      {
        number: 6,
        title: "Instruct a conveyancer or solicitor",
        body: [
          "Instruct a conveyancer to handle the legal side of the sale. The buyer should instruct their own conveyancer too.",
        ],
      },
      {
        number: 7,
        title: "Complete the property paperwork",
        body: [
          "Your conveyancer will ask you to provide information about the property and complete the relevant property information and fixtures and fittings forms.",
        ],
      },
      {
        number: 8,
        title: "Buyer arranges their mortgage and surveys",
        body: [
          "If applicable, the buyer arranges their mortgage, valuation and/or survey. They may also wish to arrange additional surveys or inspections, such as a HomeBuyer Survey, Gas Safety Record (GSR), Electrical Installation Condition Report (EICR) or other specialist checks.",
          "These are the buyer's responsibility and, unless otherwise agreed, there is no legal obligation for the seller to arrange or contribute towards the cost of these surveys or inspections.",
          "If an inspection identifies issues, the buyer may wish to use the findings to negotiate a change to the agreed price or other terms. However, the seller is under no obligation to renegotiate and can choose whether or not to accept any proposed rectifications or renegotiations.",
        ],
      },
      {
        number: 9,
        title: "Conveyancers deal with searches and enquiries",
        body: [
          "The buyer's conveyancer carries out searches and raises enquiries. Your conveyancer deals with these on your behalf.",
        ],
      },
      {
        number: 10,
        title: "Exchange contracts",
        body: [
          "Once everything is ready, contracts are signed and formally exchanged once a completion date has been agreed. The sale is legally binding from this point.",
        ],
      },
      {
        number: 11,
        title: "Complete the sale",
        body: [
          "On the agreed completion date, the buyer's funds are transferred to your conveyancer. Once received, the buyer can collect the keys and ownership transfers.",
        ],
      },
      {
        number: 12,
        title: "Receive your sale proceeds",
        body: [
          "Your conveyancer pays off any outstanding mortgage and agreed costs, with the remaining balance transferred to you.",
        ],
      },
    ],
  },
] as const

export const SELL_STEPS: readonly SellStep[] = SELL_SECTIONS.flatMap((s) => s.steps)

/**
 * General information about how a private sale works, not legal or financial
 * advice. Shown at the foot of the page.
 */
export const SELL_DISCLAIMER =
  "This guide is general information about how a private sale works in England and Wales. It isn't legal or financial advice. Your conveyancer is the right person to advise on your own sale."

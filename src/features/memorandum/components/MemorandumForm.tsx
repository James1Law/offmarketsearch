"use client"

import { MEMORANDUM_LIMITS, SELLER_CHAIN_POSITIONS } from "@/types/memorandum"
import type { MemorandumDraft, PartyDraft, ConveyancerDraft } from "@/types/memorandum"
import { BUYER_POSITIONS, FUNDING_TYPES } from "@/types"
import { TextField, TextAreaField, SelectField, FieldGroup } from "./fields"

/**
 * Which side is filling the form in.
 *
 * The seller sets the terms — they own the property, so what is included and
 * excluded is theirs to state, as Will put it. The buyer completes their own
 * details and position, and sees the seller's terms read-only. Encoding that
 * here rather than in two separate forms keeps the two views from diverging.
 */
export type FormRole = "seller" | "buyer"

const SELLER_CHAIN_OPTIONS = [
  { value: "no-onward-purchase", label: "No onward purchase" },
  { value: "found-a-property", label: "Found a property to buy" },
  { value: "looking", label: "Looking for a property to buy" },
  { value: "moving-to-rental", label: "Moving into rented accommodation" },
] as const satisfies ReadonlyArray<{ value: (typeof SELLER_CHAIN_POSITIONS)[number]; label: string }>

const BUYER_POSITION_OPTIONS = [
  { value: "nothing-to-sell", label: "Nothing to sell (including first-time buyers)" },
  { value: "sstc", label: "Own property sold, subject to contract" },
  { value: "on-market", label: "Own property on the market" },
  { value: "not-on-market-yet", label: "Own property not yet on the market" },
] as const satisfies ReadonlyArray<{ value: (typeof BUYER_POSITIONS)[number]; label: string }>

const FUNDING_OPTIONS = [
  { value: "cash", label: "Cash purchase" },
  { value: "mortgage", label: "Mortgage" },
] as const satisfies ReadonlyArray<{ value: (typeof FUNDING_TYPES)[number]; label: string }>

interface MemorandumFormProps {
  draft: MemorandumDraft
  onChange: (draft: MemorandumDraft) => void
  role: FormRole
}

export function MemorandumForm({ draft, onChange, role }: MemorandumFormProps) {
  const sellerOwns = role === "seller"
  const buyerOwns = role === "buyer"

  const set = <K extends keyof MemorandumDraft>(key: K, value: MemorandumDraft[K]) =>
    onChange({ ...draft, [key]: value })

  const setParty = (key: "seller" | "buyer", patch: Partial<PartyDraft>) =>
    onChange({ ...draft, [key]: { ...draft[key], ...patch } })

  const setConveyancer = (
    key: "sellerConveyancer" | "buyerConveyancer",
    patch: Partial<ConveyancerDraft>,
  ) => onChange({ ...draft, [key]: { ...draft[key], ...patch } })

  return (
    <div className="flex flex-col gap-8">
      <FieldGroup heading="The property">
        <TextField
          label="Property address"
          value={draft.propertyAddress}
          onChange={(v) => set("propertyAddress", v)}
          maxLength={MEMORANDUM_LIMITS.PROPERTY_ADDRESS}
          placeholder="14 Athelstan Road, Puddletown, Dorchester"
          required
          readOnly={!sellerOwns}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Postcode"
            value={draft.postcode}
            onChange={(v) => set("postcode", v)}
            maxLength={MEMORANDUM_LIMITS.POSTCODE}
            placeholder="DT2 8SL"
            readOnly={!sellerOwns}
          />
          <TextField
            label="Agreed price"
            value={draft.price}
            onChange={(v) => set("price", v)}
            maxLength={15}
            placeholder="485,000"
            hint="The price you have both agreed, in pounds"
            required
            readOnly={!sellerOwns}
          />
        </div>
      </FieldGroup>

      <FieldGroup heading="Seller">
        <TextField
          label="Full name"
          hint="Everyone named on the title, if there is more than one"
          value={draft.seller.name}
          onChange={(v) => setParty("seller", { name: v })}
          maxLength={MEMORANDUM_LIMITS.PARTY_NAME}
          required
          readOnly={!sellerOwns}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Email"
            type="email"
            value={draft.seller.email}
            onChange={(v) => setParty("seller", { email: v })}
            maxLength={MEMORANDUM_LIMITS.EMAIL}
            readOnly={!sellerOwns}
          />
          <TextField
            label="Phone"
            type="tel"
            value={draft.seller.phone}
            onChange={(v) => setParty("seller", { phone: v })}
            maxLength={MEMORANDUM_LIMITS.PHONE}
            readOnly={!sellerOwns}
          />
        </div>
      </FieldGroup>

      <FieldGroup heading="Buyer">
        <TextField
          label="Full name"
          hint={
            sellerOwns
              ? "As you understand it — the buyer can correct this when they confirm"
              : "Everyone who will be named on the purchase"
          }
          value={draft.buyer.name}
          onChange={(v) => setParty("buyer", { name: v })}
          maxLength={MEMORANDUM_LIMITS.PARTY_NAME}
          required
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Email"
            type="email"
            value={draft.buyer.email}
            onChange={(v) => setParty("buyer", { email: v })}
            maxLength={MEMORANDUM_LIMITS.EMAIL}
          />
          <TextField
            label="Phone"
            type="tel"
            value={draft.buyer.phone}
            onChange={(v) => setParty("buyer", { phone: v })}
            maxLength={MEMORANDUM_LIMITS.PHONE}
          />
        </div>
        <TextField
          label="Address"
          value={draft.buyer.address}
          onChange={(v) => setParty("buyer", { address: v })}
          maxLength={MEMORANDUM_LIMITS.PARTY_ADDRESS}
          readOnly={sellerOwns}
          hint={sellerOwns ? "The buyer adds this when they confirm" : undefined}
        />
      </FieldGroup>

      <FieldGroup heading="What is included in the sale">
        <TextAreaField
          label="Included"
          hint="Fixtures, fittings and appliances that stay with the property"
          value={draft.inclusions}
          onChange={(v) => set("inclusions", v)}
          maxLength={MEMORANDUM_LIMITS.INCLUSIONS}
          placeholder="All fixtures and fittings, carpets, curtains and blinds, integrated oven and hob."
          readOnly={!sellerOwns}
        />
        <TextAreaField
          label="Excluded"
          hint="Anything you are taking with you that a buyer might assume stays"
          value={draft.exclusions}
          onChange={(v) => set("exclusions", v)}
          maxLength={MEMORANDUM_LIMITS.EXCLUSIONS}
          placeholder="The chandelier in the living room."
          rows={2}
          readOnly={!sellerOwns}
        />
        <TextAreaField
          label="Additional contents included"
          hint="Items beyond the fixtures and fittings, and anything being paid for separately"
          value={draft.extras}
          onChange={(v) => set("extras", v)}
          maxLength={MEMORANDUM_LIMITS.EXTRAS}
          placeholder="Washing machine and tumble dryer."
          rows={2}
          readOnly={!sellerOwns}
        />
      </FieldGroup>

      <FieldGroup heading="Seller's conveyancer">
        <ConveyancerFields
          value={draft.sellerConveyancer}
          onChange={(patch) => setConveyancer("sellerConveyancer", patch)}
          readOnly={!sellerOwns}
        />
      </FieldGroup>

      <FieldGroup heading="Buyer's conveyancer">
        <ConveyancerFields
          value={draft.buyerConveyancer}
          onChange={(patch) => setConveyancer("buyerConveyancer", patch)}
          readOnly={sellerOwns}
          hint={sellerOwns ? "The buyer adds this when they confirm" : undefined}
        />
      </FieldGroup>

      <FieldGroup heading="Position and timing">
        <SelectField
          label="Seller's position"
          value={draft.sellerChain}
          onChange={(v) => set("sellerChain", v as MemorandumDraft["sellerChain"])}
          options={SELLER_CHAIN_OPTIONS}
          placeholder="Select…"
          readOnly={!sellerOwns}
        />
        <SelectField
          label="Buyer's position"
          value={draft.buyerPosition}
          onChange={(v) => set("buyerPosition", v as MemorandumDraft["buyerPosition"])}
          options={BUYER_POSITION_OPTIONS}
          placeholder="Select…"
          readOnly={sellerOwns}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <SelectField
            label="Buyer's funding"
            value={draft.funding}
            onChange={(v) => set("funding", v as MemorandumDraft["funding"])}
            options={FUNDING_OPTIONS}
            placeholder="Select…"
            readOnly={sellerOwns}
          />
          <TextField
            label="Deposit"
            value={draft.deposit}
            onChange={(v) => set("deposit", v)}
            maxLength={15}
            placeholder="48,500"
            readOnly={sellerOwns}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField
            label="Target exchange"
            type="date"
            value={draft.targetExchange}
            onChange={(v) => set("targetExchange", v)}
            maxLength={10}
            readOnly={buyerOwns}
          />
          <TextField
            label="Target completion"
            type="date"
            value={draft.targetCompletion}
            onChange={(v) => set("targetCompletion", v)}
            maxLength={10}
            readOnly={buyerOwns}
          />
        </div>
      </FieldGroup>

      <FieldGroup heading="Anything else">
        <TextAreaField
          label="Other terms"
          hint="Conditions you have agreed, such as a sale subject to survey"
          value={draft.notes}
          onChange={(v) => set("notes", v)}
          maxLength={MEMORANDUM_LIMITS.NOTES}
          readOnly={!sellerOwns}
        />
      </FieldGroup>
    </div>
  )
}

function ConveyancerFields({
  value,
  onChange,
  readOnly,
  hint,
}: {
  value: ConveyancerDraft
  onChange: (patch: Partial<ConveyancerDraft>) => void
  readOnly: boolean
  hint?: string | undefined
}) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        <TextField
          label="Firm"
          value={value.firm}
          onChange={(v) => onChange({ firm: v })}
          maxLength={MEMORANDUM_LIMITS.CONVEYANCER_FIRM}
          hint={hint ?? "Leave blank if not yet instructed"}
          readOnly={readOnly}
        />
        <TextField
          label="Contact"
          value={value.contact}
          onChange={(v) => onChange({ contact: v })}
          maxLength={MEMORANDUM_LIMITS.CONVEYANCER_CONTACT}
          readOnly={readOnly}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <TextField
          label="Email"
          type="email"
          value={value.email}
          onChange={(v) => onChange({ email: v })}
          maxLength={MEMORANDUM_LIMITS.EMAIL}
          readOnly={readOnly}
        />
        <TextField
          label="Phone"
          type="tel"
          value={value.phone}
          onChange={(v) => onChange({ phone: v })}
          maxLength={MEMORANDUM_LIMITS.PHONE}
          readOnly={readOnly}
        />
      </div>
    </>
  )
}

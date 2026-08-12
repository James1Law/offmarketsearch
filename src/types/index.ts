import { z } from "zod"

export const SelectedAddressSchema = z.object({
  id: z.string(),
  displayAddress: z.string(),
  streetAddress: z.string(),
  postcode: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
})

export type SelectedAddress = z.infer<typeof SelectedAddressSchema>

export const PROPERTY_TYPES = ["detached", "semi-detached", "terraced", "flat", "bungalow"] as const

export const PropertyTypeSchema = z.enum(PROPERTY_TYPES)

export type PropertyType = z.infer<typeof PropertyTypeSchema>

export const PropertyAttributesSchema = z.object({
  propertyType: PropertyTypeSchema,
  bedrooms: z.number().int().min(1).max(6),
  floorAreaSqm: z.number().int().positive(),
  hasGarden: z.boolean(),
  hasParking: z.boolean(),
})

export type PropertyAttributes = z.infer<typeof PropertyAttributesSchema>

export const RefineFiltersSchema = z.object({
  /** Empty array means "any property type". */
  propertyTypes: z.array(PropertyTypeSchema),
  /** 0 means "any". */
  minBedrooms: z.number().int().min(0),
  /** 0 means "any". */
  minFloorAreaSqm: z.number().int().min(0),
  mustHaveGarden: z.boolean(),
  mustHaveParking: z.boolean(),
})

export type RefineFilters = z.infer<typeof RefineFiltersSchema>

export const BUYER_POSITIONS = [
  "nothing-to-sell",
  "sstc",
  "on-market",
  "not-on-market-yet",
] as const

export const FUNDING_TYPES = ["cash", "mortgage"] as const

export const TIMESCALES = ["2-3-months", "3-6-months", "relaxed"] as const

export const MOTIVATIONS = [
  "downsizing",
  "upsizing",
  "second-home",
  "investment",
  "development",
  "relocation",
  "first-time-buyer",
] as const

export const BuyerPositionSchema = z.enum(BUYER_POSITIONS)
export const FundingTypeSchema = z.enum(FUNDING_TYPES)
export const TimescaleSchema = z.enum(TIMESCALES)
export const MotivationSchema = z.enum(MOTIVATIONS)

export type BuyerPosition = z.infer<typeof BuyerPositionSchema>
export type FundingType = z.infer<typeof FundingTypeSchema>
export type Timescale = z.infer<typeof TimescaleSchema>
export type Motivation = z.infer<typeof MotivationSchema>

export const LetterContentSchema = z.object({
  templateId: z.string(),
  senderName: z.string().min(1).max(100),
  senderAddress: z.string().min(1).max(300),
  senderPhone: z.string().max(30).optional(),
  senderEmail: z.string().max(100).optional(),
  // All optional — senders choose which parts of their situation to mention.
  position: BuyerPositionSchema.optional(),
  funding: FundingTypeSchema.optional(),
  timescale: TimescaleSchema.optional(),
  motivation: MotivationSchema.optional(),
})

export type LetterContent = z.infer<typeof LetterContentSchema>

export const CampaignStateSchema = z.object({
  selectedAddresses: z.array(SelectedAddressSchema),
  refineFilters: RefineFiltersSchema.nullable(),
  letterContent: LetterContentSchema.nullable(),
})

export type CampaignState = z.infer<typeof CampaignStateSchema>

export const NominatimResultSchema = z.object({
  place_id: z.number(),
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  boundingbox: z.array(z.string()).length(4),
})

export type NominatimResult = z.infer<typeof NominatimResultSchema>

export const OverpassElementSchema = z.object({
  type: z.string(),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).optional(),
})

export type OverpassElement = z.infer<typeof OverpassElementSchema>

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

export const LetterContentSchema = z.object({
  templateId: z.string(),
  senderName: z.string().min(1).max(100),
  senderAddress: z.string().min(1).max(300),
  personalMessage: z.string().max(600),
})

export type LetterContent = z.infer<typeof LetterContentSchema>

export const CampaignStateSchema = z.object({
  selectedAddresses: z.array(SelectedAddressSchema),
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

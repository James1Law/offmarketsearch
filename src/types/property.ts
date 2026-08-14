import { z } from "zod"

export const PROPERTY_TYPES = ["detached", "semi-detached", "terraced", "flat", "bungalow"] as const

export const PropertyTypeSchema = z.enum(PROPERTY_TYPES)

export type PropertyType = z.infer<typeof PropertyTypeSchema>

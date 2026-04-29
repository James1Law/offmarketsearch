import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_MAPTILER_API_KEY: z.string().optional(),
})

// Validates at module load time — fails loudly if required vars are missing.
export const env = envSchema.parse({
  NEXT_PUBLIC_MAPTILER_API_KEY: process.env["NEXT_PUBLIC_MAPTILER_API_KEY"],
})

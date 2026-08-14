import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_MAPTILER_API_KEY: z.string().optional(),
  // Server-only. Optional: without it, Chimnie enrichment is limited to the
  // free sandbox postcode and everything else falls back to sample data.
  CHIMNIE_API_KEY: z.string().optional(),
})

// Validates at module load time — fails loudly if required vars are missing.
export const env = envSchema.parse({
  NEXT_PUBLIC_MAPTILER_API_KEY: process.env["NEXT_PUBLIC_MAPTILER_API_KEY"],
  CHIMNIE_API_KEY: process.env["CHIMNIE_API_KEY"],
})

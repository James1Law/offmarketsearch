import { z } from "zod"
import { PropertyTypeSchema } from "./index"

// ---------------------------------------------------------------------------
// Domain model — what the app stores and renders after enrichment.
// Every field is nullable: property data is sparse and any source can miss any
// field for any address.
// ---------------------------------------------------------------------------

/** Chimnie's predicted-years-until-sale bands, soonest first. */
export const SALE_PROPENSITY_BANDS = ["<1y", "1-2y", "2-5y", "5-10y", "10+y"] as const

export const SalePropensitySchema = z.enum(SALE_PROPENSITY_BANDS)

export type SalePropensity = z.infer<typeof SalePropensitySchema>

export const EnrichedAttributesSchema = z.object({
  propertyType: PropertyTypeSchema.nullable(),
  bedrooms: z.number().int().nullable(),
  floorAreaSqm: z.number().nullable(),
  parking: z.boolean().nullable(),
  garage: z.boolean().nullable(),
  /** EPC band A–G. */
  epcRating: z.string().nullable(),
  /** Council tax band A–H (A–I in Wales). */
  councilTaxBand: z.string().nullable(),
  estimatedValueGbp: z.number().int().nullable(),
  lastSoldPriceGbp: z.number().int().nullable(),
  /** ISO-ish date string as returned by the source. */
  lastSoldDate: z.string().nullable(),
  yearsOwned: z.number().int().nullable(),
  salePropensity: SalePropensitySchema.nullable(),
})

export type EnrichedAttributes = z.infer<typeof EnrichedAttributesSchema>

export const AreaSaleStatsSchema = z.object({
  pricePerSqft: z.number().nullable(),
  daysToSell: z.number().nullable(),
  salesNearby12m: z.number().nullable(),
  salesYoy: z.number().nullable(),
  averageYearsOwned: z.number().nullable(),
})

export type AreaSaleStats = z.infer<typeof AreaSaleStatsSchema>

export const EnrichmentSourceSchema = z.enum(["chimnie", "sample"])

export type EnrichmentSource = z.infer<typeof EnrichmentSourceSchema>

export const EnrichmentResultSchema = z.object({
  addressId: z.string(),
  source: EnrichmentSourceSchema,
  uprn: z.string().nullable(),
  attributes: EnrichedAttributesSchema,
  areaStats: AreaSaleStatsSchema.nullable(),
})

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>

// ---------------------------------------------------------------------------
// Raw Chimnie residential response — the Core-tier subset we request via the
// `fields` parameter. Validated at the API boundary before mapping. Unknown
// keys are stripped; every level is optional because sparse-data properties
// omit whole branches.
// ---------------------------------------------------------------------------

export const ChimnieResidentialResponseSchema = z.object({
  /** Root id is the property's UPRN. */
  id: z.string().optional(),
  exact_match: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  property: z
    .object({
      attributes: z
        .object({
          status: z
            .object({
              property_type_predicted: z.string().optional(),
              epc_property_type: z.string().optional(),
              epc_built_form: z.string().optional(),
              latitude: z.number().optional(),
              longitude: z.number().optional(),
            })
            .optional(),
          indoor: z
            .object({
              bedrooms_declared_and_predicted: z.number().optional(),
              floor_area_declared_and_predicted: z.number().optional(),
            })
            .optional(),
          outdoor: z
            .object({
              parking: z.boolean().optional(),
              garage: z.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
      bills: z
        .object({
          tax: z
            .object({
              council_tax_band_declared_and_predicted: z.string().optional(),
            })
            .optional(),
          energy: z
            .object({
              current_energy_rating_declared_and_predicted: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      value: z
        .object({
          sale: z
            .object({
              property_value: z.number().optional(),
              last_transaction_price: z.number().optional(),
              last_transaction_date: z.string().optional(),
              years_owned: z.number().optional(),
              sale_propensity: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  surroundings: z
    .object({
      values: z
        .object({
          sale: z
            .object({
              price_per_sqft: z.number().optional(),
              days_to_sell: z.number().optional(),
              sales_nearby_12m: z.number().optional(),
              sales_yoy: z.number().optional(),
              average_years_owned: z.number().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
})

export type ChimnieResidentialResponse = z.infer<typeof ChimnieResidentialResponseSchema>

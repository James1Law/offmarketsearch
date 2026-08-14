// Required acknowledgements for displaying data obtained via the Chimnie API.
// Reproduce these wherever Chimnie-sourced property data is shown.
const ATTRIBUTION_LINES = [
  "Property data by Chimnie.",
  "Ordnance Survey data © Crown copyright and database rights 2026 OS AC0000854954.",
  "Royal Mail data © Royal Mail copyright and database right 2026.",
  "HM Land Registry data © Crown copyright and database right 2026, licensed under the Open Government Licence v3.0.",
  "Contains data created and maintained by Scottish local government.",
]

export function DataAttribution() {
  return (
    <p className="text-[9px] leading-relaxed text-navy-soft/60 mt-6">
      {ATTRIBUTION_LINES.join(" ")}
    </p>
  )
}

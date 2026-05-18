export const SHIPPING_RATES = {
  STANDARD: { label: "Standard (5–7 days)", amount: 599, display: "$5.99" },
  EXPRESS: { label: "Express (2–3 days)", amount: 1299, display: "$12.99" },
  OVERNIGHT: { label: "Overnight (1 day)", amount: 2999, display: "$29.99" },
} as const;
export type ShippingMethod = keyof typeof SHIPPING_RATES;

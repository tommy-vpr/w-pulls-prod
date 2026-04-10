export const SHIPPING_RATES = {
  STANDARD: { label: "Standard (5-7 days)", amount: 0, display: "FREE" },
  EXPRESS: { label: "Express (2-3 days)", amount: 999, display: "$9.99" },
  OVERNIGHT: { label: "Overnight (1 day)", amount: 1999, display: "$19.99" },
} as const;
export type ShippingMethod = keyof typeof SHIPPING_RATES;

// lib/analytics/gtm.ts
// Central place for all GTM dataLayer pushes

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

function push(event: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

// ─── Page View ───────────────────────────────────────────────
export function trackPageView(url: string) {
  push({ event: "page_view", page_path: url });
}

// ─── Pack Events ─────────────────────────────────────────────
export function trackPackView(packId: string, packName: string, price: number) {
  push({
    event: "view_item",
    ecommerce: {
      items: [
        {
          item_id: packId,
          item_name: packName,
          price: price / 100,
          item_category: "pack",
        },
      ],
    },
  });
}

export function trackPackCheckoutStart(
  packId: string,
  packName: string,
  price: number,
) {
  push({
    event: "begin_checkout",
    ecommerce: {
      items: [
        {
          item_id: packId,
          item_name: packName,
          price: price / 100,
          item_category: "pack",
        },
      ],
    },
  });
}

export function trackPackPurchase(
  orderId: string,
  packName: string,
  price: number,
  tier: string,
) {
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: orderId,
      value: price / 100,
      currency: "USD",
      items: [
        {
          item_id: orderId,
          item_name: packName,
          price: price / 100,
          item_category: "pack",
          item_variant: tier,
        },
      ],
    },
  });
}

export function trackCardReveal(
  orderId: string,
  cardTitle: string,
  tier: string,
  value: number,
) {
  push({
    event: "card_reveal",
    card_title: cardTitle,
    card_tier: tier,
    card_value: value,
    order_id: orderId,
  });
}

// ─── Product/Store Events ─────────────────────────────────────
export function trackProductView(
  productId: string,
  title: string,
  price: number,
  tier: string,
) {
  push({
    event: "view_item",
    ecommerce: {
      items: [
        {
          item_id: productId,
          item_name: title,
          price,
          item_category: "product",
          item_variant: tier,
        },
      ],
    },
  });
}

export function trackAddToCart(
  productId: string,
  title: string,
  price: number,
  quantity: number,
) {
  push({
    event: "add_to_cart",
    ecommerce: {
      items: [
        {
          item_id: productId,
          item_name: title,
          price,
          quantity,
          item_category: "product",
        },
      ],
    },
  });
}

export function trackProductPurchase(
  orderId: string,
  items: { id: string; name: string; price: number; quantity: number }[],
  total: number,
) {
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: orderId,
      value: total / 100,
      currency: "USD",
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price / 100,
        quantity: i.quantity,
        item_category: "product",
      })),
    },
  });
}

// ─── Buyback Events ───────────────────────────────────────────
export function trackBuybackOffer(
  cardTitle: string,
  tier: string,
  offerAmount: number,
) {
  push({
    event: "buyback_offer_shown",
    card_title: cardTitle,
    card_tier: tier,
    offer_amount: offerAmount / 100,
  });
}

export function trackBuybackAccepted(
  cardTitle: string,
  tier: string,
  amount: number,
) {
  push({
    event: "buyback_accepted",
    card_title: cardTitle,
    card_tier: tier,
    buyback_amount: amount / 100,
  });
}

// ─── Auth Events ──────────────────────────────────────────────
export function trackSignUp(method: "email" | "google") {
  push({ event: "sign_up", method });
}

export function trackLogin(method: "email" | "google") {
  push({ event: "login", method });
}

// ─── Wallet Events ────────────────────────────────────────────
export function trackWithdrawalRequest(amount: number) {
  push({ event: "withdrawal_request", amount: amount / 100 });
}

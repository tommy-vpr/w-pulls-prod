// lib/webhooks/wms.ts
import { Product } from "@prisma/client";

export async function triggerWMSProductCreated(product: Product) {
  const wmsUrl = process.env.WMS_PRODUCT_WEBHOOK_URL;
  const secret = process.env.WMS_WEBHOOK_SECRET;
  if (!wmsUrl || !secret || !product.sku) return;
  await fetch(wmsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": secret,
      "x-source": "wpulls",
    },
    body: JSON.stringify({
      event: "product.created",
      wpullsProductId: product.id,
      sku: product.sku,
      name: product.title,
      imageUrl: product.imageUrl,
      weight: product.weight ? Number(product.weight) : 0.3,
      weightUnit: product.weightUnit ?? "oz",
      sellingPrice: Number(product.price),
      initialInventory: product.inventory,
    }),
  }).catch((err) => console.error("[WMS] Product webhook failed:", err));
}

export async function triggerWMSInventoryAdjusted(
  sku: string,
  newQuantity: number,
) {
  const wmsUrl = process.env.WMS_PRODUCT_WEBHOOK_URL?.replace(
    "/products",
    "/inventory",
  );
  const secret = process.env.WMS_WEBHOOK_SECRET;
  if (!wmsUrl || !secret) return;
  await fetch(wmsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": secret },
    body: JSON.stringify({
      event: "inventory.adjusted",
      sku,
      newQuantity,
      reason: "MANUAL_ADJUSTMENT",
    }),
  }).catch((err) => console.error("[WMS] Inventory webhook failed:", err));
}

export async function triggerWMSShipmentWebhook(shipmentRequest: any) {
  const wmsUrl = process.env.WMS_WEBHOOK_URL;
  const secret = process.env.WMS_WEBHOOK_SECRET;
  if (!wmsUrl || !secret) throw new Error("WMS webhook not configured");
  const res = await fetch(wmsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": secret,
      "x-source": "wpulls",
    },
    body: JSON.stringify({
      event: "shipment.requested",
      shipmentRequestId: shipmentRequest.id,
      customerName: shipmentRequest.shippingName,
      customerEmail: shipmentRequest.user?.email,
      shippingAddress: {
        name: shipmentRequest.shippingName,
        address1: shipmentRequest.shippingLine1, // ← was line1
        address2: shipmentRequest.shippingLine2, // ← was line2
        city: shipmentRequest.shippingCity,
        state: shipmentRequest.shippingState,
        zip: shipmentRequest.shippingPostal, // ← was postalCode
        country: shipmentRequest.shippingCountry,
      },
      shippingMethod: shipmentRequest.shippingMethod,
      shippingFeePaid: shipmentRequest.shippingFeeAmount,
      items: shipmentRequest.items.map((item: any) => ({
        orderItemId: item.orderItemId,
        orderId: item.orderItem.orderId,
        sku: item.product.sku,
        title: item.product.title,
        tier: item.product.tier,
        imageUrl: item.product.imageUrl,
      })),
    }),
  });
  if (!res.ok) throw new Error(`WMS webhook failed: ${res.status}`);
  console.log(`[WMS] ✅ Shipment webhook fired for ${shipmentRequest.id}`);
}

export async function triggerWMSProductOrder(order: {
  id: string;
  orderNumber: number;
  customerName: string | null;
  customerEmail: string | null;
  amount: number;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  items: Array<{
    product: {
      sku: string | null;
      title: string;
      imageUrl: string | null;
    } | null;
    quantity: number;
    unitPrice: any;
  }>;
}) {
  const url = process.env.WMS_PRODUCT_ORDER_WEBHOOK_URL;
  const secret = process.env.WMS_WEBHOOK_SECRET;

  if (!url || !secret) {
    console.warn("[WMS] Product order webhook not configured — skipping");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": secret,
    },
    body: JSON.stringify({
      wpullsOrderId: order.id,
      orderNumber: `#WPULLS-${String(order.orderNumber)}`,
      customerName: order.customerName ?? "W-Pulls Customer",
      customerEmail: order.customerEmail ?? null,
      totalAmount: (order.amount ?? 0) / 100,
      shippingAddress: {
        name: order.customerName ?? "W-Pulls Customer",
        address1: order.shippingLine1, // ← was line1
        address2: order.shippingLine2, // ← was line2
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingPostal, // ← was postal
        country: order.shippingCountry ?? "US",
      },
      items: order.items.map((i) => ({
        sku: i.product?.sku ?? null,
        title: i.product?.title ?? "Unknown",
        imageUrl: i.product?.imageUrl ?? null,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
    }),
  });

  if (!res.ok) {
    console.error(`[WMS] Product order webhook failed: ${res.status}`);
  } else {
    console.log(`[WMS] ✅ Product order sent to WMS: ${order.orderNumber}`);
  }
}

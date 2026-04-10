// lib/emails/send-shipment-confirmed.ts
import { resend } from "@/lib/resend";

interface ShipmentItem {
  title: string;
  imageUrl?: string | null;
  tier: string;
}

interface SendShipmentConfirmedParams {
  to: string;
  customerName: string;
  shipmentRequestId: string;
  shippingMethod: string;
  shippingFeeAmount: number;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  items: ShipmentItem[];
}

const METHOD_LABELS: Record<string, string> = {
  STANDARD: "Standard Shipping (5–7 business days)",
  EXPRESS: "Express Shipping (2–3 business days)",
  OVERNIGHT: "Overnight Shipping (1 business day)",
};

function generateHTML(params: SendShipmentConfirmedParams): string {
  const {
    customerName,
    shipmentRequestId,
    shippingMethod,
    shippingFeeAmount,
    shippingAddress,
    items,
  } = params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wpulls.com";
  const shortId = shipmentRequestId.slice(-8).toUpperCase();
  const methodLabel = METHOD_LABELS[shippingMethod] ?? shippingMethod;

  const itemsHTML = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; vertical-align: middle; width: 56px;">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" alt="${item.title}" width="48" height="48"
                  style="width:48px;height:48px;object-fit:cover;border-radius:6px;
                  border:1px solid rgba(0,255,255,0.2);display:block;" />`
              : `<div style="width:48px;height:48px;border-radius:6px;
                  background:rgba(0,255,255,0.1);border:1px solid rgba(0,255,255,0.2);"></div>`
          }
        </td>
        <td style="padding: 10px 0; padding-left: 14px; vertical-align: middle;">
          <p style="font-size:14px;font-weight:bold;color:#ffffff;margin:0 0 3px 0;">${item.title}</p>
          <p style="font-size:11px;color:rgba(0,255,255,0.5);margin:0;text-transform:uppercase;letter-spacing:1px;">${item.tier.replace("_", " ")}</p>
        </td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipment Confirmed — W-Pulls</title>
</head>
<body style="background-color:#030812;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Logo -->
    <div style="text-align:center;padding:30px 0;">
      <p style="font-size:28px;font-weight:bold;color:#00ffff;letter-spacing:4px;margin:0;">W-Pulls</p>
      <p style="font-size:10px;color:rgba(0,255,255,0.5);letter-spacing:3px;margin:4px 0 0 0;">CARD SYSTEM</p>
    </div>

    <!-- Banner -->
    <div style="background:linear-gradient(135deg,rgba(0,255,255,0.1),rgba(0,100,200,0.05));border:1px solid rgba(0,255,255,0.3);border-radius:12px;padding:30px;text-align:center;margin-bottom:28px;">
      <p style="font-size:44px;color:#00ffff;margin:0 0 10px 0;">📦</p>
      <h1 style="font-size:22px;color:#ffffff;margin:0 0 8px 0;">Shipment Confirmed!</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.7);margin:0;">
        Your card${items.length > 1 ? "s are" : " is"} on the way to the warehouse, ${customerName}.
      </p>
    </div>

    <!-- Shipment ID -->
    <div style="background:rgba(12,20,28,0.95);border:1px solid rgba(0,255,255,0.2);border-radius:8px;padding:18px;margin-bottom:20px;text-align:center;">
      <p style="font-size:10px;color:rgba(0,255,255,0.6);letter-spacing:2px;margin:0 0 6px 0;text-transform:uppercase;">Shipment Request</p>
      <p style="font-size:18px;font-weight:bold;color:#ffffff;margin:0;">#${shortId}</p>
    </div>

    <!-- Items -->
    <div style="background:rgba(12,20,28,0.95);border:1px solid rgba(0,255,255,0.15);border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:bold;color:#00ffff;letter-spacing:2px;margin:0 0 16px 0;text-transform:uppercase;">
        Card${items.length > 1 ? "s" : ""} Being Shipped
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHTML}
      </table>
    </div>

    <!-- Shipping details -->
    <div style="background:rgba(12,20,28,0.95);border:1px solid rgba(0,255,255,0.15);border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:bold;color:#00ffff;letter-spacing:2px;margin:0 0 14px 0;text-transform:uppercase;">Shipping Details</p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;width:120px;">
            <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0;">Method</p>
          </td>
          <td style="padding:4px 0;">
            <p style="font-size:13px;color:#ffffff;margin:0;">${methodLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;">
            <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0;">Fee</p>
          </td>
          <td style="padding:4px 0;">
            <p style="font-size:13px;color:${shippingFeeAmount === 0 ? "#4ade80" : "#00ffff"};margin:0;">
              ${shippingFeeAmount === 0 ? "FREE" : `$${(shippingFeeAmount / 100).toFixed(2)}`}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0 4px;vertical-align:top;">
            <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0;">Ship To</p>
          </td>
          <td style="padding:10px 0 4px;">
            <p style="font-size:13px;color:#ffffff;line-height:1.6;margin:0;">
              ${shippingAddress.name}<br />
              ${shippingAddress.line1}<br />
              ${shippingAddress.line2 ? `${shippingAddress.line2}<br />` : ""}
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal}<br />
              ${shippingAddress.country}
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- What happens next -->
    <div style="background:rgba(0,255,255,0.04);border:1px solid rgba(0,255,255,0.12);border-radius:8px;padding:18px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:bold;color:#00ffff;letter-spacing:2px;margin:0 0 10px 0;text-transform:uppercase;">What Happens Next</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;line-height:1.7;">
        Our warehouse team will pick and pack your card${items.length > 1 ? "s" : ""}.
        Once a shipping label is created you'll receive a separate email with your tracking number.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:10px 0 20px;">
      <a href="${baseUrl}/dashboard/shipments"
        style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">
        Track Shipment
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0;">
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 8px 0;">
        Questions? <a href="${baseUrl}/support" style="color:#00ffff;text-decoration:underline;">Contact Support</a>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.25);margin:0;">© ${new Date().getFullYear()} W-Pulls. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendShipmentConfirmedEmail(
  params: SendShipmentConfirmedParams,
) {
  try {
    const { error } = await resend.emails.send({
      from: "W-Pulls <orders@emails.hq.team>",
      to: params.to,
      subject: `Shipment Confirmed — Your card${params.items.length > 1 ? "s are" : " is"} being packed`,
      html: generateHTML(params),
    });

    if (error) {
      console.error("[Email] Shipment confirmed send failed:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Shipment confirmed error:", err);
    return { success: false, error: err };
  }
}

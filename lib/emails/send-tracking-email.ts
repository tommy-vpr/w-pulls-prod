// lib/emails/send-tracking-email.ts
import { resend } from "@/lib/resend";

interface TrackingItem {
  title: string;
  imageUrl?: string | null;
}

interface SendTrackingEmailParams {
  to: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string | null;
  items: TrackingItem[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
}

const CARRIER_LABELS: Record<string, string> = {
  ups: "UPS",
  fedex: "FedEx",
  stamps_com: "USPS",
  usps: "USPS",
};

const CARRIER_TRACKING_URLS: Record<string, (t: string) => string> = {
  ups: (t) => `https://www.ups.com/track?tracknum=${t}`,
  fedex: (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
  stamps_com: (t) =>
    `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
  usps: (t) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`,
};

function resolveTrackingUrl(
  carrier: string,
  trackingNumber: string,
  trackingUrl?: string | null,
): string {
  if (trackingUrl) return trackingUrl;
  const builder = CARRIER_TRACKING_URLS[carrier.toLowerCase()];
  return builder
    ? builder(trackingNumber)
    : `https://google.com/search?q=${carrier}+tracking+${trackingNumber}`;
}

function generateHTML(params: SendTrackingEmailParams): string {
  const {
    customerName,
    trackingNumber,
    carrier,
    trackingUrl,
    items,
    shippingAddress,
  } = params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wpulls.com";
  const carrierLabel =
    CARRIER_LABELS[carrier.toLowerCase()] ?? carrier.toUpperCase();
  const finalTrackingUrl = resolveTrackingUrl(
    carrier,
    trackingNumber,
    trackingUrl,
  );

  const itemsHTML = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;vertical-align:middle;width:52px;">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" alt="${item.title}" width="44" height="44"
                  style="width:44px;height:44px;object-fit:cover;border-radius:6px;
                  border:1px solid rgba(0,255,255,0.2);display:block;" />`
              : `<div style="width:44px;height:44px;border-radius:6px;
                  background:rgba(0,255,255,0.1);border:1px solid rgba(0,255,255,0.2);"></div>`
          }
        </td>
        <td style="padding:8px 0;padding-left:14px;vertical-align:middle;">
          <p style="font-size:14px;font-weight:bold;color:#ffffff;margin:0;">${item.title}</p>
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
  <title>Your Card is on the Way — W-Pulls</title>
</head>
<body style="background-color:#030812;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Logo -->
    <div style="text-align:center;padding:30px 0;">
      <p style="font-size:28px;font-weight:bold;color:#00ffff;letter-spacing:4px;margin:0;">W-Pulls</p>
      <p style="font-size:10px;color:rgba(0,255,255,0.5);letter-spacing:3px;margin:4px 0 0 0;">CARD SYSTEM</p>
    </div>

    <!-- Banner -->
    <div style="background:linear-gradient(135deg,rgba(0,200,100,0.1),rgba(0,255,255,0.05));border:1px solid rgba(0,200,100,0.3);border-radius:12px;padding:30px;text-align:center;margin-bottom:28px;">
      <p style="font-size:44px;color:#4ade80;margin:0 0 10px 0;">🚚</p>
      <h1 style="font-size:22px;color:#ffffff;margin:0 0 8px 0;">Your card${items.length > 1 ? "s are" : " is"} on the way!</h1>
      <p style="font-size:15px;color:rgba(255,255,255,0.7);margin:0;">
        ${customerName}, your shipment has been picked up by ${carrierLabel}.
      </p>
    </div>

    <!-- Tracking number — big CTA -->
    <div style="background:rgba(12,20,28,0.98);border:1px solid rgba(0,255,255,0.3);border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;">
      <p style="font-size:11px;color:rgba(0,255,255,0.6);letter-spacing:2px;margin:0 0 10px 0;text-transform:uppercase;">
        ${carrierLabel} Tracking Number
      </p>
      <p style="font-size:22px;font-weight:bold;color:#ffffff;font-family:monospace;margin:0 0 20px 0;letter-spacing:2px;">
        ${trackingNumber}
      </p>
      <a href="${finalTrackingUrl}" target="_blank"
        style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">
        Track Your Package
      </a>
    </div>

    <!-- Items -->
    <div style="background:rgba(12,20,28,0.95);border:1px solid rgba(0,255,255,0.15);border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="font-size:11px;font-weight:bold;color:#00ffff;letter-spacing:2px;margin:0 0 14px 0;text-transform:uppercase;">
        Card${items.length > 1 ? "s" : ""} in This Shipment
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsHTML}
      </table>
    </div>

    <!-- Shipping to -->
    <div style="background:rgba(12,20,28,0.95);border:1px solid rgba(0,255,255,0.15);border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:bold;color:#00ffff;letter-spacing:2px;margin:0 0 12px 0;text-transform:uppercase;">Delivering To</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.7;margin:0;">
        ${shippingAddress.name}<br />
        ${shippingAddress.line1}<br />
        ${shippingAddress.line2 ? `${shippingAddress.line2}<br />` : ""}
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal}<br />
        ${shippingAddress.country}
      </p>
    </div>

    <!-- Secondary CTA -->
    <div style="text-align:center;padding:4px 0 20px;">
      <a href="${baseUrl}/dashboard/shipments"
        style="display:inline-block;background:transparent;color:#00ffff;font-size:13px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:8px;border:1px solid rgba(0,255,255,0.35);letter-spacing:1px;text-transform:uppercase;">
        View All Shipments
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

export async function sendTrackingEmail(params: SendTrackingEmailParams) {
  try {
    const { error } = await resend.emails.send({
      from: "W-Pulls <orders@emails.hq.team>",
      to: params.to,
      subject: `Your card${params.items.length > 1 ? "s are" : " is"} on the way — ${CARRIER_LABELS[params.carrier.toLowerCase()] ?? params.carrier.toUpperCase()} ${params.trackingNumber}`,
      html: generateHTML(params),
    });

    if (error) {
      console.error("[Email] Tracking email send failed:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Tracking email error:", err);
    return { success: false, error: err };
  }
}

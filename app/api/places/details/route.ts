import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json();
    if (!placeId) {
      return NextResponse.json({ error: "placeId required" }, { status: 400 });
    }

    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask": "addressComponents",
        },
      },
    );

    const data = await res.json();
    const comp = (type: string) =>
      data.addressComponents?.find((c: any) => c.types?.includes(type));

    const streetNumber = comp("street_number")?.longText ?? "";
    const route = comp("route")?.longText ?? "";

    const address = {
      line1: `${streetNumber} ${route}`.trim(),
      city:
        comp("locality")?.longText ??
        comp("sublocality")?.longText ??
        comp("postal_town")?.longText ??
        "",
      state: comp("administrative_area_level_1")?.shortText ?? "",
      postal: comp("postal_code")?.longText ?? "",
      country: comp("country")?.shortText ?? "US",
    };

    return NextResponse.json({ address });
  } catch (err) {
    console.error("Places details error:", err);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
}

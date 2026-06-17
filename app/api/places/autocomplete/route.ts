import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    if (!input || input.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const res = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
        },
        body: JSON.stringify({
          input,
          includedRegionCodes: ["us"],
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Google Places error:", res.status, data);
      return NextResponse.json({
        suggestions: [],
        error: data?.error?.message,
      });
    }

    const suggestions = (data.suggestions ?? []).map((s: any) => ({
      placeId: s.placePrediction?.placeId,
      text: s.placePrediction?.text?.text,
    }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Places autocomplete error:", err);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}

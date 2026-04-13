import { NextRequest, NextResponse } from "next/server";

// In-memory cache per symbol+range
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol");
  const range = searchParams.get("range") ?? "1mo";

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const cacheKey = `${symbol}:${range}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const intervalMap: Record<string, string> = {
    "1d": "15m",
    "5d": "1h",
    "1mo": "1d",
    "6mo": "1d",
    "1y": "1wk",
    "max": "1mo",
  };
  const interval = intervalMap[range] ?? "1d";

  try {
    const res = await fetch(
      `https://brapi.dev/api/quote/${symbol}?range=${range}&interval=${interval}&fundamental=false`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      if (cached) return NextResponse.json(cached.data);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 502 });
    }

    const data = await res.json();
    const result = data.results?.[0];

    if (!result?.historicalDataPrice) {
      return NextResponse.json({ prices: [] });
    }

    const prices = result.historicalDataPrice.map(
      (p: Record<string, unknown>) => ({
        date: p.date,
        open: p.open ?? 0,
        high: p.high ?? 0,
        low: p.low ?? 0,
        close: p.close ?? 0,
        volume: p.volume ?? 0,
      })
    );

    const payload = {
      prices,
      currentPrice: result.regularMarketPrice,
      name: result.shortName ?? result.longName ?? symbol,
    };

    cache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload);
  } catch (e) {
    console.error("History API error:", e);
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

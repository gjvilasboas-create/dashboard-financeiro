import { NextResponse } from "next/server";

const WATCHED_STOCKS = [
  "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3",
  "WEGE3", "RENT3", "BBAS3", "SUZB3", "GGBR4",
  "MGLU3", "HAPV3", "RADL3", "JBSS3", "RAIL3",
  "HGLG11", "XPML11", "MXRF11", "KNRI11", "VISC11",
];

// In-memory cache
let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 3 * 60_000; // 3 minutes

export const dynamic = "force-dynamic";

const TOKEN = process.env.BRAPI_TOKEN ?? "";

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    let allResults: Record<string, unknown>[] = [];
    const tokenParam = TOKEN ? `&token=${TOKEN}` : "";

    if (TOKEN) {
      // With token: fetch all symbols at once (no rate-limit issues)
      const symbols = WATCHED_STOCKS.join(",");
      const res = await fetch(
        `https://brapi.dev/api/quote/${symbols}?fundamental=false${tokenParam}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        allResults = data.results ?? [];
      }
    } else {
      // Without token: brapi limits to ~3 requests/min with max 3 symbols each.
      // Fetch one batch of the top 3 liquid stocks for instant response.
      const symbols = WATCHED_STOCKS.slice(0, 3).join(",");
      const res = await fetch(
        `https://brapi.dev/api/quote/${symbols}?fundamental=false`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        allResults = data.results ?? [];
      }
    }

    if (allResults.length === 0) {
      if (cache) return NextResponse.json(cache.data);
      return NextResponse.json(
        { error: "Nenhum dado disponível no momento." },
        { status: 502 }
      );
    }

    const results = allResults.map((r) => ({
      symbol: r.symbol,
      shortName: r.shortName ?? r.longName ?? r.symbol,
      regularMarketPrice: r.regularMarketPrice ?? 0,
      regularMarketChangePercent: r.regularMarketChangePercent ?? 0,
      regularMarketChange: r.regularMarketChange ?? 0,
      regularMarketVolume: r.regularMarketVolume ?? 0,
      regularMarketDayHigh: r.regularMarketDayHigh ?? 0,
      regularMarketDayLow: r.regularMarketDayLow ?? 0,
    }));

    const payload = { results, hasToken: !!TOKEN };
    cache = { data: payload, timestamp: Date.now() };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("Stock API error:", e);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

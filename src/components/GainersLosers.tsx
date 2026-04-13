"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockQuote } from "@/lib/types";
import StockCard from "./StockCard";

export default function GainersLosers({
  stocks,
  onSelectStock,
}: {
  stocks: StockQuote[];
  onSelectStock: (symbol: string) => void;
}) {
  const sorted = [...stocks].sort(
    (a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent
  );
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gainers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-gain/10">
            <TrendingUp className="w-4 h-4 text-gain" />
          </div>
          <h2 className="font-bold text-base">Top 5 Altas</h2>
        </div>
        <div className="space-y-2">
          {gainers.map((s) => (
            <StockCard
              key={s.symbol}
              stock={s}
              onClick={() => onSelectStock(s.symbol)}
            />
          ))}
        </div>
      </div>

      {/* Losers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-loss/10">
            <TrendingDown className="w-4 h-4 text-loss" />
          </div>
          <h2 className="font-bold text-base">Top 5 Quedas</h2>
        </div>
        <div className="space-y-2">
          {losers.map((s) => (
            <StockCard
              key={s.symbol}
              stock={s}
              onClick={() => onSelectStock(s.symbol)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

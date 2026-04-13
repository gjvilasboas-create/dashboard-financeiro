"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { StockQuote } from "@/lib/types";

export default function StockCard({
  stock,
  onClick,
}: {
  stock: StockQuote;
  onClick: () => void;
}) {
  const isPositive = stock.regularMarketChangePercent >= 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-card border border-card-border hover:border-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm">{stock.symbol}</p>
          <p className="text-xs text-muted truncate">{stock.shortName}</p>
        </div>
        <div className="text-right ml-3">
          <p className="font-mono font-semibold text-sm">
            R$ {stock.regularMarketPrice.toFixed(2)}
          </p>
          <div
            className={`flex items-center justify-end gap-1 text-xs font-medium ${
              isPositive ? "text-gain" : "text-loss"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {stock.regularMarketChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

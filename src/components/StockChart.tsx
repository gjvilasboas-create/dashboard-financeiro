"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { HistoricalPrice } from "@/lib/types";

const RANGES = [
  { label: "1D", value: "1d" },
  { label: "1S", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "6M", value: "6mo" },
  { label: "1A", value: "1y" },
  { label: "MAX", value: "max" },
];

function formatDate(timestamp: number, range: string) {
  const d = new Date(timestamp * 1000);
  if (range === "1d") return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (range === "5d") return d.toLocaleDateString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function StockChart({
  symbol,
  onClose,
}: {
  symbol: string;
  onClose: () => void;
}) {
  const [range, setRange] = useState("1mo");
  const [prices, setPrices] = useState<HistoricalPrice[]>([]);
  const [name, setName] = useState(symbol);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/stocks/history?symbol=${symbol}&range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPrices(data.prices ?? []);
        setName(data.name ?? symbol);
        setCurrentPrice(data.currentPrice ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, range]);

  const chartData = prices.map((p) => ({
    date: formatDate(p.date, range),
    price: p.close,
  }));

  const isPositive =
    chartData.length >= 2
      ? chartData[chartData.length - 1].price >= chartData[0].price
      : true;

  const color = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-card-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <div>
            <h2 className="font-bold text-lg">{symbol}</h2>
            <p className="text-xs text-muted">{name}</p>
          </div>
          <div className="flex items-center gap-3">
            {currentPrice !== null && (
              <span className="font-mono font-bold text-lg">
                R$ {currentPrice.toFixed(2)}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-card-border/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Range buttons */}
        <div className="flex gap-1 p-4 pb-2 overflow-x-auto">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                range === r.value
                  ? "bg-accent text-white"
                  : "bg-card-border/50 text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="p-4 pt-2 h-[300px] sm:h-[350px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted text-sm">
              Sem dados disponíveis para este período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#a3a3a3" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "#a3a3a3" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Preço"]}
                  labelStyle={{ color: "#a3a3a3" }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

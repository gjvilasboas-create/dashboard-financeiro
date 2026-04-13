"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import type { StockQuote } from "@/lib/types";
import GainersLosers from "./GainersLosers";
import StockChart from "./StockChart";

export default function Dashboard() {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStocks(data.results ?? []);
      setLastUpdate(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-xl">Destaques do Dia</h2>
          <p className="text-sm text-muted">
            Ações, FIIs e BDRs do mercado brasileiro
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-muted flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Atualizado às {lastUpdate}
            </span>
          )}
          <button
            onClick={fetchStocks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-card-border hover:border-accent/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {stocks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Ativos monitorados"
            value={stocks.length.toString()}
          />
          <SummaryCard
            label="Em alta"
            value={stocks.filter((s) => s.regularMarketChangePercent > 0).length.toString()}
            color="text-gain"
          />
          <SummaryCard
            label="Em baixa"
            value={stocks.filter((s) => s.regularMarketChangePercent < 0).length.toString()}
            color="text-loss"
          />
          <SummaryCard
            label="Maior alta"
            value={`${Math.max(...stocks.map((s) => s.regularMarketChangePercent)).toFixed(2)}%`}
            color="text-gain"
          />
        </div>
      )}

      {/* Content */}
      {loading && stocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="text-sm">Carregando cotações...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <WifiOff className="w-10 h-10 mb-3" />
          <p className="text-sm mb-2">{error}</p>
          <button
            onClick={fetchStocks}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <GainersLosers stocks={stocks} onSelectStock={setSelectedSymbol} />
      )}

      {/* All stocks grid */}
      {stocks.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-3">Todos os Ativos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {stocks
              .sort((a, b) => a.symbol.localeCompare(b.symbol))
              .map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => setSelectedSymbol(s.symbol)}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-card-border hover:border-accent/50 transition-all text-sm"
                >
                  <div>
                    <span className="font-bold">{s.symbol}</span>
                    <span className="text-muted ml-2 text-xs hidden sm:inline">
                      {s.shortName?.slice(0, 15)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono">
                      R$ {s.regularMarketPrice.toFixed(2)}
                    </span>
                    <span
                      className={`ml-2 text-xs font-medium ${
                        s.regularMarketChangePercent >= 0
                          ? "text-gain"
                          : "text-loss"
                      }`}
                    >
                      {s.regularMarketChangePercent >= 0 ? "+" : ""}
                      {s.regularMarketChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Chart modal */}
      {selectedSymbol && (
        <StockChart
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color ?? ""}`}>{value}</p>
    </div>
  );
}

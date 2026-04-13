"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { HistoricalPrice } from "@/lib/types";

const POPULAR_STOCKS = [
  "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3",
  "WEGE3", "BBAS3", "MGLU3", "RENT3", "SUZB3",
];

interface Indicators {
  sma20: (number | null)[];
  sma50: (number | null)[];
  rsi14: (number | null)[];
  support: number;
  resistance: number;
  signal: "compra" | "venda" | "neutro";
  signalReasons: string[];
}

function calcSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calcRSI(data: number[], period: number): (number | null)[] {
  const rsi: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period + 1) return rsi;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}

function analyze(closes: number[]): Indicators {
  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const rsi14 = calcRSI(closes, 14);

  // Support/Resistance: simple min/max of last 20 candles
  const recent = closes.slice(-20);
  const support = Math.min(...recent);
  const resistance = Math.max(...recent);

  // Signal logic
  const lastPrice = closes[closes.length - 1];
  const lastSMA20 = sma20[sma20.length - 1];
  const lastSMA50 = sma50[sma50.length - 1];
  const lastRSI = rsi14[rsi14.length - 1];
  const prevSMA20 = sma20[sma20.length - 2];
  const prevSMA50 = sma50[sma50.length - 2];

  const reasons: string[] = [];
  let bullPoints = 0;
  let bearPoints = 0;

  // Price vs SMA20
  if (lastSMA20 !== null) {
    if (lastPrice > lastSMA20) {
      bullPoints++;
      reasons.push("Preço acima da MMA 20");
    } else {
      bearPoints++;
      reasons.push("Preço abaixo da MMA 20");
    }
  }

  // SMA20 vs SMA50 (golden cross / death cross)
  if (lastSMA20 !== null && lastSMA50 !== null && prevSMA20 !== null && prevSMA50 !== null) {
    if (lastSMA20 > lastSMA50) {
      bullPoints++;
      if (prevSMA20 <= prevSMA50) {
        bullPoints++;
        reasons.push("Golden Cross: MMA 20 cruzou acima da MMA 50");
      } else {
        reasons.push("MMA 20 acima da MMA 50 (tendência de alta)");
      }
    } else {
      bearPoints++;
      if (prevSMA20 >= prevSMA50) {
        bearPoints++;
        reasons.push("Death Cross: MMA 20 cruzou abaixo da MMA 50");
      } else {
        reasons.push("MMA 20 abaixo da MMA 50 (tendência de baixa)");
      }
    }
  }

  // RSI
  if (lastRSI !== null) {
    if (lastRSI > 70) {
      bearPoints += 2;
      reasons.push(`RSI em ${lastRSI.toFixed(0)} (sobrecomprado)`);
    } else if (lastRSI < 30) {
      bullPoints += 2;
      reasons.push(`RSI em ${lastRSI.toFixed(0)} (sobrevendido)`);
    } else if (lastRSI > 50) {
      bullPoints++;
      reasons.push(`RSI em ${lastRSI.toFixed(0)} (momentum positivo)`);
    } else {
      bearPoints++;
      reasons.push(`RSI em ${lastRSI.toFixed(0)} (momentum negativo)`);
    }
  }

  let signal: "compra" | "venda" | "neutro" = "neutro";
  if (bullPoints >= bearPoints + 2) signal = "compra";
  else if (bearPoints >= bullPoints + 2) signal = "venda";

  return { sma20, sma50, rsi14, support, resistance, signal, signalReasons: reasons };
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function TechnicalAnalysis() {
  const [symbol, setSymbol] = useState("PETR4");
  const [prices, setPrices] = useState<HistoricalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockName, setStockName] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/stocks/history?symbol=${symbol}&range=6mo`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPrices(data.prices ?? []);
        setStockName(data.name ?? symbol);
        setCurrentPrice(data.currentPrice ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const closes = useMemo(() => prices.map((p) => p.close), [prices]);
  const indicators = useMemo(
    () => (closes.length > 0 ? analyze(closes) : null),
    [closes]
  );

  const chartData = useMemo(() => {
    if (!indicators) return [];
    return prices.map((p, i) => ({
      date: formatDate(p.date),
      preco: p.close,
      mma20: indicators.sma20[i] !== null ? Math.round(indicators.sma20[i]! * 100) / 100 : undefined,
      mma50: indicators.sma50[i] !== null ? Math.round(indicators.sma50[i]! * 100) / 100 : undefined,
    }));
  }, [prices, indicators]);

  const rsiData = useMemo(() => {
    if (!indicators) return [];
    return prices
      .map((p, i) => ({
        date: formatDate(p.date),
        rsi: indicators.rsi14[i] !== null ? Math.round(indicators.rsi14[i]!) : undefined,
      }))
      .filter((d) => d.rsi !== undefined);
  }, [prices, indicators]);

  const lastRSI = indicators?.rsi14.filter((v) => v !== null).pop() ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/10">
          <BarChart3 className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="font-bold text-xl">Análise Técnica</h2>
          <p className="text-sm text-muted">
            Indicadores básicos para auxiliar suas decisões
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted">
          <strong className="text-amber-500">Aviso:</strong> Esta análise é
          educativa e não constitui recomendação de investimento. Sempre faça
          sua própria pesquisa antes de tomar decisões financeiras.
        </p>
      </div>

      {/* Stock selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {POPULAR_STOCKS.map((s) => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              symbol === s
                ? "bg-accent text-white"
                : "bg-card border border-card-border text-muted hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="text-sm">Calculando indicadores...</p>
        </div>
      ) : !indicators || prices.length < 20 ? (
        <div className="text-center py-20 text-muted text-sm">
          Dados insuficientes para calcular indicadores deste ativo
        </div>
      ) : (
        <>
          {/* Signal + Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Signal */}
            <div
              className={`rounded-xl p-4 border ${
                indicators.signal === "compra"
                  ? "bg-gain/5 border-gain/20"
                  : indicators.signal === "venda"
                  ? "bg-loss/5 border-loss/20"
                  : "bg-card border-card-border"
              }`}
            >
              <p className="text-xs text-muted mb-1">Sinal</p>
              <div className="flex items-center gap-2">
                {indicators.signal === "compra" ? (
                  <TrendingUp className="w-5 h-5 text-gain" />
                ) : indicators.signal === "venda" ? (
                  <TrendingDown className="w-5 h-5 text-loss" />
                ) : (
                  <Minus className="w-5 h-5 text-muted" />
                )}
                <span
                  className={`text-xl font-bold uppercase ${
                    indicators.signal === "compra"
                      ? "text-gain"
                      : indicators.signal === "venda"
                      ? "text-loss"
                      : "text-muted"
                  }`}
                >
                  {indicators.signal}
                </span>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs text-muted mb-1">Preço Atual</p>
              <p className="text-xl font-bold font-mono">
                R$ {currentPrice?.toFixed(2) ?? "-"}
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs text-muted mb-1">Suporte</p>
              <p className="text-xl font-bold font-mono text-gain">
                R$ {indicators.support.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs text-muted mb-1">Resistência</p>
              <p className="text-xl font-bold font-mono text-loss">
                R$ {indicators.resistance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Signal reasons */}
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-3">Análise dos Indicadores</h3>
            <ul className="space-y-2">
              {indicators.signalReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-2" />
                  <span className="text-muted">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Price chart with SMAs */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-1">
              {symbol} — {stockName}
            </h3>
            <p className="text-xs text-muted mb-4">
              Preço + Médias Móveis (MMA 20 e MMA 50) · Últimos 6 meses
            </p>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        preco: "Preço",
                        mma20: "MMA 20",
                        mma50: "MMA 50",
                      };
                      return [`R$ ${Number(value).toFixed(2)}`, labels[String(name)] ?? name];
                    }}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  {indicators.support && (
                    <ReferenceLine
                      y={indicators.support}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                  )}
                  {indicators.resistance && (
                    <ReferenceLine
                      y={indicators.resistance}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="preco"
                    stroke="#ededed"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mma20"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 2"
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mma50"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 2"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#ededed] inline-block" /> Preço
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#3b82f6] inline-block" /> MMA 20
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#f59e0b] inline-block" /> MMA 50
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-gain inline-block border-dashed" /> Suporte
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-loss inline-block border-dashed" /> Resistência
              </span>
            </div>
          </div>

          {/* RSI chart */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">RSI — Índice de Força Relativa (14)</h3>
                <p className="text-xs text-muted">
                  Acima de 70 = sobrecomprado · Abaixo de 30 = sobrevendido
                </p>
              </div>
              {lastRSI !== null && (
                <span
                  className={`text-2xl font-bold font-mono ${
                    lastRSI > 70
                      ? "text-loss"
                      : lastRSI < 30
                      ? "text-gain"
                      : "text-foreground"
                  }`}
                >
                  {lastRSI.toFixed(0)}
                </span>
              )}
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rsiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 30, 50, 70, 100]}
                    tick={{ fontSize: 10, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.6} />
                  <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.6} />
                  <ReferenceLine y={50} stroke="#666" strokeDasharray="2 4" strokeOpacity={0.4} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [Number(value).toFixed(1), "RSI"]}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Indicator glossary */}
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-3">Glossário dos Indicadores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-accent">MMA 20 (Média Móvel Aritmética)</p>
                <p className="text-muted text-xs mt-1">
                  Média dos últimos 20 fechamentos. Indica tendência de curto prazo.
                  Preço acima = tendência de alta.
                </p>
              </div>
              <div>
                <p className="font-medium text-amber-500">MMA 50</p>
                <p className="text-muted text-xs mt-1">
                  Média dos últimos 50 fechamentos. Indica tendência de médio prazo.
                  Quando MMA 20 cruza acima da MMA 50, é o &quot;Golden Cross&quot;.
                </p>
              </div>
              <div>
                <p className="font-medium text-purple-500">RSI (Índice de Força Relativa)</p>
                <p className="text-muted text-xs mt-1">
                  Oscilador de 0 a 100. Acima de 70 sugere que o ativo está caro
                  (sobrecomprado). Abaixo de 30, barato (sobrevendido).
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground">Suporte e Resistência</p>
                <p className="text-muted text-xs mt-1">
                  Suporte é o menor preço recente (piso). Resistência é o maior (teto).
                  Rompimentos indicam força da tendência.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

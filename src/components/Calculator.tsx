"use client";

import { useState, useMemo } from "react";
import { Calculator as CalcIcon, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { GoalResult } from "@/lib/types";

function calculateGoal(
  goal: number,
  initial: number,
  monthly: number,
  ratePercent: number,
  isAnnual: boolean
): GoalResult | null {
  if (goal <= 0 || ratePercent <= 0) return null;

  const monthlyRate = isAnnual
    ? Math.pow(1 + ratePercent / 100, 1 / 12) - 1
    : ratePercent / 100;

  const timeline: GoalResult["timeline"] = [];
  let total = initial;
  let totalInvested = initial;
  const maxMonths = 1200; // 100 years cap

  for (let m = 1; m <= maxMonths; m++) {
    total = total * (1 + monthlyRate) + monthly;
    totalInvested += monthly;
    const interest = total - totalInvested;

    // Sample points for chart (not every month for long timelines)
    const shouldInclude =
      m <= 24 ||
      (m <= 120 && m % 6 === 0) ||
      (m <= 360 && m % 12 === 0) ||
      m % 60 === 0 ||
      total >= goal;

    if (shouldInclude) {
      timeline.push({
        month: m,
        invested: Math.round(totalInvested),
        interest: Math.round(Math.max(0, interest)),
        total: Math.round(total),
      });
    }

    if (total >= goal) {
      return { months: m, timeline };
    }
  }

  return null;
}

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatLabel(month: number) {
  if (month < 12) return `${month}m`;
  const y = Math.floor(month / 12);
  const m = month % 12;
  return m === 0 ? `${y}a` : `${y}a${m}m`;
}

export default function Calculator() {
  const [goal, setGoal] = useState("");
  const [initial, setInitial] = useState("");
  const [monthly, setMonthly] = useState("");
  const [rate, setRate] = useState("");
  const [isAnnual, setIsAnnual] = useState(true);

  const result = useMemo(() => {
    return calculateGoal(
      parseFloat(goal) || 0,
      parseFloat(initial) || 0,
      parseFloat(monthly) || 0,
      parseFloat(rate) || 0,
      isAnnual
    );
  }, [goal, initial, monthly, rate, isAnnual]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/10">
          <CalcIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="font-bold text-xl">Calculadora de Metas</h2>
          <p className="text-sm text-muted">
            A magia dos juros compostos a seu favor
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4 bg-card border border-card-border rounded-2xl p-6">
          <InputField
            label="Meta financeira"
            placeholder="Ex: 1000000"
            value={goal}
            onChange={setGoal}
            prefix="R$"
          />
          <InputField
            label="Aporte inicial"
            placeholder="Ex: 5000"
            value={initial}
            onChange={setInitial}
            prefix="R$"
          />
          <InputField
            label="Aporte mensal"
            placeholder="Ex: 1000"
            value={monthly}
            onChange={setMonthly}
            prefix="R$"
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Taxa de rentabilidade
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex: 12"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                  %
                </span>
              </div>
              <div className="flex bg-card-border/50 rounded-xl p-0.5">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    !isAnnual ? "bg-accent text-white" : "text-muted"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isAnnual ? "bg-accent text-white" : "text-muted"
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-accent" />
                <p className="text-sm font-medium text-accent">
                  Tempo para atingir a meta
                </p>
              </div>
              <p className="text-2xl font-bold">
                {Math.floor(result.months / 12) > 0 && (
                  <>{Math.floor(result.months / 12)} anos </>
                )}
                {result.months % 12 > 0 && (
                  <>{result.months % 12} meses</>
                )}
                {result.months % 12 === 0 && Math.floor(result.months / 12) > 0 && null}
              </p>
              <p className="text-xs text-muted mt-1">
                Total investido:{" "}
                {formatCurrency(
                  (parseFloat(initial) || 0) +
                    (parseFloat(monthly) || 0) * result.months
                )}{" "}
                · Juros:{" "}
                {formatCurrency(
                  (parseFloat(goal) || 0) -
                    ((parseFloat(initial) || 0) +
                      (parseFloat(monthly) || 0) * result.months)
                )}
              </p>
            </div>
          )}

          {!result && parseFloat(goal) > 0 && parseFloat(rate) > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-loss/10 border border-loss/20">
              <p className="text-sm text-loss">
                Não é possível atingir a meta em menos de 100 anos com esses parâmetros.
                Tente aumentar o aporte mensal ou a taxa de rentabilidade.
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Evolução do Patrimônio</h3>
          {result && result.timeline.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.timeline} stackOffset="none">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#a3a3a3" }}
                    tickFormatter={formatLabel}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : `${v}`
                    }
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === "invested" ? "Investido" : "Juros",
                    ]}
                    labelFormatter={(m) => formatLabel(Number(m))}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === "invested" ? "Dinheiro Investido" : "Juros Compostos"
                    }
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="invested"
                    stackId="a"
                    fill="#3b82f6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="interest"
                    stackId="a"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted text-sm text-center px-4">
              Preencha os campos ao lado para visualizar a evolução do seu patrimônio ao longo do tempo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  prefix,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-background border border-card-border rounded-xl ${
            prefix ? "pl-10" : "pl-4"
          } pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors`}
        />
      </div>
    </div>
  );
}

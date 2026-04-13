"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  X,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  parseCSV,
  CATEGORY_COLORS,
  type Expense,
} from "@/lib/expense-parser";

function formatBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type SortKey = "date" | "description" | "amount" | "category";
type SortDir = "asc" | "desc";

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState("");

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.match(/\.csv$/i)) {
      setError("Formato não suportado. Envie um arquivo .csv");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError(
          "Não foi possível ler o arquivo. Verifique se é um CSV de fatura com colunas de data, descrição e valor."
        );
        return;
      }
      setExpenses(parsed);
      setFilterCategory(null);
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Derived data
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      map.set(exp.category, (map.get(exp.category) ?? 0) + exp.amount);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      const monthKey = exp.date.slice(0, 7); // YYYY-MM
      map.set(monthKey, (map.get(monthKey) ?? 0) + exp.amount);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => {
        const [y, m] = month.split("-");
        return { month: `${m}/${y}`, total: Math.round(total * 100) / 100 };
      });
  }, [expenses]);

  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const avgPerDay = useMemo(() => {
    if (expenses.length === 0) return 0;
    const dates = new Set(expenses.map((e) => e.date));
    return totalSpent / dates.size;
  }, [expenses, totalSpent]);

  const topCategory = categories[0]?.name ?? "-";

  // Sort + filter
  const filtered = useMemo(() => {
    let list = [...expenses];
    if (filterCategory) {
      list = list.filter((e) => e.category === filterCategory);
    }
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [expenses, filterCategory, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "amount" ? "desc" : "asc");
    }
  };

  const allCategories = useMemo(
    () => [...new Set(Object.keys(CATEGORY_COLORS))].sort(),
    []
  );

  const saveCategory = (idx: number) => {
    setExpenses((prev) => {
      const next = [...prev];
      // Find the actual index in unfiltered array
      const target = filtered[idx];
      const realIdx = prev.findIndex(
        (e) =>
          e.date === target.date &&
          e.description === target.description &&
          e.amount === target.amount
      );
      if (realIdx !== -1) {
        next[realIdx] = { ...next[realIdx], category: editCategory };
      }
      return next;
    });
    setEditingIdx(null);
  };

  // --- RENDER ---

  if (expenses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <FileSpreadsheet className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Análise de Gastos</h2>
            <p className="text-sm text-muted">
              Suba a fatura do cartão e descubra para onde vai seu dinheiro
            </p>
          </div>
        </div>

        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            dragActive
              ? "border-accent bg-accent/5"
              : "border-card-border hover:border-accent/50"
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={onFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-10 h-10 mx-auto mb-4 text-muted" />
          <p className="font-medium mb-1">
            Arraste o arquivo CSV aqui ou clique para selecionar
          </p>
          <p className="text-sm text-muted">
            Funciona com faturas do Nubank, Inter, Itaú, Bradesco, C6 e outros
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-loss/10 border border-loss/20 text-sm text-loss">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-sm">Como exportar seu CSV</h3>
          <div className="space-y-2 text-sm text-muted">
            <p>
              <strong className="text-foreground">Nubank:</strong> App → Cartão
              de crédito → Fatura → ··· → Exportar fatura (CSV)
            </p>
            <p>
              <strong className="text-foreground">Inter:</strong> App → Cartão →
              Fatura → Exportar → CSV
            </p>
            <p>
              <strong className="text-foreground">Itaú:</strong> Internet
              Banking → Cartão → Fatura → Exportar
            </p>
            <p>
              <strong className="text-foreground">Outros bancos:</strong> Procure
              a opção &quot;Exportar&quot; ou &quot;Baixar fatura&quot; no app ou
              internet banking
            </p>
          </div>
          <div className="pt-2 border-t border-card-border">
            <p className="text-xs text-muted">
              O arquivo deve ter colunas de <strong>data</strong>,{" "}
              <strong>descrição</strong> e <strong>valor</strong>. Separador: vírgula ou
              ponto-e-vírgula. Seus dados são processados localmente no navegador — nada é
              enviado para servidores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <PieChartIcon className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Análise de Gastos</h2>
            <p className="text-sm text-muted">
              {fileName} · {expenses.length} transações
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setExpenses([]);
            setFileName(null);
            setError(null);
            setFilterCategory(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-card-border hover:border-loss/50 hover:text-loss transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar dados
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total gasto" value={formatBRL(totalSpent)} color="text-loss" />
        <SummaryCard label="Transações" value={expenses.length.toString()} />
        <SummaryCard label="Média/dia" value={formatBRL(avgPerDay)} />
        <SummaryCard label="Maior categoria" value={topCategory} color="text-accent" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Gastos por Categoria</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  strokeWidth={0}
                  cursor="pointer"
                  onClick={(entry) => {
                    const name = entry.name as string;
                    setFilterCategory((prev) =>
                      prev === name ? null : name
                    );
                  }}
                >
                  {categories.map((cat) => (
                    <Cell
                      key={cat.name}
                      fill={CATEGORY_COLORS[cat.name] ?? "#6b7280"}
                      opacity={
                        filterCategory && filterCategory !== cat.name ? 0.3 : 1
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [formatBRL(Number(value)), "Total"]}
                  labelStyle={{ color: "#a3a3a3" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.name}
                onClick={() =>
                  setFilterCategory((prev) =>
                    prev === cat.name ? null : cat.name
                  )
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-opacity ${
                  filterCategory && filterCategory !== cat.name
                    ? "opacity-40"
                    : ""
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[cat.name] ?? "#6b7280",
                  }}
                />
                <span className="truncate">{cat.name}</span>
                <span className="text-muted">{formatBRL(cat.value)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly bar chart */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-4">Gastos por Mês</h3>
          {monthlyData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#333"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#a3a3a3" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
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
                    formatter={(value) => [formatBRL(Number(value)), "Total"]}
                    labelStyle={{ color: "#a3a3a3" }}
                  />
                  <Bar dataKey="total" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted text-sm">
              Dados insuficientes
            </div>
          )}

          {/* Category ranking */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-muted">
              Ranking de categorias
            </h4>
            {categories.map((cat, i) => {
              const pct = totalSpent > 0 ? (cat.value / totalSpent) * 100 : 0;
              return (
                <button
                  key={cat.name}
                  onClick={() =>
                    setFilterCategory((prev) =>
                      prev === cat.name ? null : cat.name
                    )
                  }
                  className={`w-full flex items-center gap-2 text-xs transition-opacity ${
                    filterCategory && filterCategory !== cat.name
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  <span className="w-4 text-muted text-right">{i + 1}.</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[cat.name] ?? "#6b7280",
                    }}
                  />
                  <span className="flex-1 text-left truncate">{cat.name}</span>
                  <span className="text-muted">{pct.toFixed(1)}%</span>
                  <span className="font-mono w-24 text-right">
                    {formatBRL(cat.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter badge */}
      {filterCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Filtrando por:</span>
          <button
            onClick={() => setFilterCategory(null)}
            className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-lg"
          >
            {filterCategory}
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <h3 className="font-bold text-sm">
            Transações{" "}
            <span className="text-muted font-normal">
              ({filtered.length})
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs text-muted">
                {(
                  [
                    ["date", "Data"],
                    ["description", "Descrição"],
                    ["category", "Categoria"],
                    ["amount", "Valor"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th key={key} className="px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {label}
                      {sortKey === key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => (
                <tr
                  key={`${exp.date}-${exp.description}-${i}`}
                  className="border-b border-card-border/50 hover:bg-card-border/20 transition-colors"
                >
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDateBR(exp.date)}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] sm:max-w-[300px] truncate">
                    {exp.description}
                  </td>
                  <td className="px-4 py-3">
                    {editingIdx === i ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="bg-background border border-card-border rounded-lg px-2 py-1 text-xs"
                        >
                          {allCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => saveCategory(i)}
                          className="text-xs text-accent hover:underline"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingIdx(null)}
                          className="text-xs text-muted hover:underline"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingIdx(i);
                          setEditCategory(exp.category);
                        }}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[exp.category] ?? "#6b7280",
                          }}
                        />
                        <span className="text-xs">{exp.category}</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-loss whitespace-nowrap text-right">
                    {formatBRL(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
      <p className={`text-lg sm:text-xl font-bold mt-0.5 truncate ${color ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

"use client";

import { Moon, Sun, TrendingUp } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "news", label: "Notícias" },
  { id: "analysis", label: "Análise" },
  { id: "expenses", label: "Gastos" },
  { id: "calculator", label: "Calculadora" },
];

export default function Header({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const { theme, toggle } = useTheme();

  return (
    <header className="border-b border-card-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          <h1 className="text-lg font-bold tracking-tight">
            Finanças do <span className="text-accent">Gabriel V</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground hover:bg-card-border/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-card-border/50 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-t border-card-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-fit px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "text-accent border-b-2 border-accent"
                : "text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}

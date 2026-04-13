"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  date: string;
  category: "mercado" | "economia" | "cripto" | "internacional";
}

// Placeholder news — replace with real API (ex: NewsAPI, GNews, or custom scraper)
const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    title: "Ibovespa fecha em alta puxado por commodities e bancos",
    description:
      "O principal índice da bolsa brasileira encerrou o pregão com ganhos expressivos, impulsionado pela valorização de Petrobras e Vale após dados positivos da China.",
    url: "#",
    source: "Placeholder",
    date: new Date().toISOString(),
    category: "mercado",
  },
  {
    title: "Copom mantém Selic em 14,25% e sinaliza cautela com inflação",
    description:
      "O Banco Central decidiu manter a taxa básica de juros inalterada, citando a necessidade de monitorar os impactos da política fiscal sobre a inflação.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 3600000).toISOString(),
    category: "economia",
  },
  {
    title: "Bitcoin supera US$ 90 mil e renova máxima histórica",
    description:
      "A criptomoeda mais valiosa do mundo alcançou um novo recorde, impulsionada pela entrada de capital institucional e aprovação de novos ETFs.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 7200000).toISOString(),
    category: "cripto",
  },
  {
    title: "Fed sinaliza possível corte de juros no segundo semestre",
    description:
      "O presidente do Federal Reserve indicou que a economia americana apresenta sinais de desaceleração suficientes para justificar uma redução nas taxas de juros.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 10800000).toISOString(),
    category: "internacional",
  },
  {
    title: "Dólar recua para R$ 5,65 com fluxo estrangeiro positivo",
    description:
      "A moeda americana perdeu força frente ao real após entrada de capital estrangeiro na B3 e melhora no cenário externo.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 14400000).toISOString(),
    category: "economia",
  },
  {
    title: "Petrobras anuncia dividendos extraordinários de R$ 15 bi",
    description:
      "A estatal divulgou resultado trimestral acima do esperado e aprovou a distribuição de proventos extras aos acionistas.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 18000000).toISOString(),
    category: "mercado",
  },
  {
    title: "Reforma tributária: como ficam os investimentos em renda fixa",
    description:
      "Especialistas analisam os impactos das mudanças propostas na tributação de CDBs, LCIs e debêntures para o investidor pessoa física.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 21600000).toISOString(),
    category: "economia",
  },
  {
    title: "S&P 500 renova máxima com resultados de big techs acima do esperado",
    description:
      "As ações de tecnologia impulsionaram Wall Street após balanços trimestrais de Apple, Microsoft e Nvidia superarem as projeções dos analistas.",
    url: "#",
    source: "Placeholder",
    date: new Date(Date.now() - 25200000).toISOString(),
    category: "internacional",
  },
];

const CATEGORY_STYLES: Record<string, { label: string; color: string }> = {
  mercado: { label: "Mercado", color: "bg-gain/10 text-gain" },
  economia: { label: "Economia", color: "bg-accent/10 text-accent" },
  cripto: { label: "Cripto", color: "bg-amber-500/10 text-amber-500" },
  internacional: { label: "Internacional", color: "bg-purple-500/10 text-purple-500" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiConfigured, setApiConfigured] = useState(false);

  useEffect(() => {
    // TODO: Replace with real API call
    // Example: fetch('/api/news').then(r => r.json()).then(data => setNews(data))
    setLoading(true);
    setTimeout(() => {
      setNews(PLACEHOLDER_NEWS);
      setApiConfigured(false);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = filter ? news.filter((n) => n.category === filter) : news;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Newspaper className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-xl">Últimas Notícias</h2>
            <p className="text-sm text-muted">
              Fique por dentro do mercado financeiro
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-card-border hover:border-accent/50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* API notice */}
      {!apiConfigured && (
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-accent mb-1">
              Dados de exemplo — conecte sua API de notícias
            </p>
            <p className="text-muted">
              As notícias abaixo são placeholders. Para dados reais, integre uma API como{" "}
              <strong>NewsAPI</strong>, <strong>GNews</strong> ou <strong>Google News RSS</strong>.
              Edite o arquivo{" "}
              <code className="px-1.5 py-0.5 bg-card-border/50 rounded text-xs">
                src/components/News.tsx
              </code>{" "}
              e substitua o fetch no useEffect.
            </p>
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            filter === null
              ? "bg-accent text-white"
              : "bg-card border border-card-border text-muted hover:text-foreground"
          }`}
        >
          Todas
        </button>
        {Object.entries(CATEGORY_STYLES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setFilter((prev) => (prev === key ? null : key))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === key
                ? "bg-accent text-white"
                : "bg-card border border-card-border text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* News list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-card-border rounded-2xl p-5 animate-pulse"
            >
              <div className="h-4 bg-card-border/50 rounded w-3/4 mb-3" />
              <div className="h-3 bg-card-border/50 rounded w-full mb-2" />
              <div className="h-3 bg-card-border/50 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const cat = CATEGORY_STYLES[item.category];
            return (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-card border border-card-border rounded-2xl p-5 hover:border-accent/50 transition-all hover:scale-[1.005] active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${cat?.color}`}
                      >
                        {cat?.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="w-3 h-3" />
                        {timeAgo(item.date)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base mb-1 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      Fonte: {item.source}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted shrink-0 mt-1" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-muted text-sm">
          Nenhuma notícia encontrada para este filtro
        </div>
      )}
    </div>
  );
}

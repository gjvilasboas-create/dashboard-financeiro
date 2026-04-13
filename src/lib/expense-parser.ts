export interface Expense {
  date: string;
  description: string;
  amount: number;
  category: string;
}

// Category rules: keyword → category
const CATEGORY_RULES: [RegExp, string][] = [
  // Alimentação
  [/ifood|rappi|uber\s*eats|zé\s*delivery/i, "Delivery"],
  [/restaurante|rest\.|lanchonete|pizzaria|burger|sushi|churrascaria|padaria|confeitaria|cafe|café|starbucks|mcdonald|mc\s*donald|subway|bk\s|burger\s*king|kfc|popeyes|spoleto|outback|madero|coco\s*bambu/i, "Restaurantes"],
  [/supermercado|supermerc|mercado|assai|assaí|atacadao|atacadão|carrefour|extra\s|pao\s*de\s*acucar|pão\s*de\s*açúcar|sams\s*club|sam'?s|makro|rede\s|dia\s|big\s|nacional|zaffari|bretas|savegnago|muffato|condor|angeloni/i, "Supermercado"],
  [/açougue|acougue|hortifruti|sacolao|sacolão|feira|quitanda/i, "Supermercado"],

  // Transporte
  [/uber(?!\s*eats)|99\s*(?:pop|taxi)|cabify|lyft/i, "Transporte"],
  [/combustivel|combustível|posto|shell|ipiranga|br\s*distribuidora|petrob|ale\s|gasolina|etanol|diesel/i, "Combustível"],
  [/estacionamento|estapar|park|zona\s*azul/i, "Estacionamento"],
  [/pedagio|pedágio|sem\s*parar|conectcar|move\s*mais/i, "Pedágio"],

  // Moradia
  [/aluguel|condominio|condomínio|iptu/i, "Moradia"],
  [/luz|energia|enel|cpfl|cemig|celesc|copel|equatorial|energisa|neoenergia|coelba|cosern|celpe/i, "Energia"],
  [/agua|água|sanepar|sabesp|copasa|compesa|casan|caern/i, "Água"],
  [/gas\s|gás|comgas|comgás|supergasbras|ultragaz|liquigás|nacional\s*gas/i, "Gás"],

  // Telecom & Digital
  [/netflix|disney|hbo|max\s|prime\s*video|amazon\s*prime|globoplay|paramount|star\+|apple\s*tv|crunchyroll|spotify|deezer|youtube\s*premium|tidal/i, "Streaming"],
  [/claro|vivo|tim\s|oi\s|net\s|telecom|internet|fibra/i, "Telecom"],
  [/google|apple|icloud|microsoft|adobe|chatgpt|openai|canva|notion|dropbox|zoom/i, "Assinaturas Digitais"],

  // Saúde
  [/farmacia|farmácia|drogaria|droga\s*raia|drogasil|pague\s*menos|droga\s*clara|panvel|pacheco|araujo|nissei/i, "Farmácia"],
  [/hospital|hosp\.|clinica|clínica|médico|medico|consulta|laboratório|laboratorio|exame|unimed|amil|sulamerica|bradesco\s*saude|hapvida|notredame/i, "Saúde"],
  [/academia|smartfit|smart\s*fit|blufit|bodytech|crossfit|gympass|wellhub|totalpass/i, "Academia"],

  // Compras
  [/amazon|mercado\s*livre|magalu|magazine\s*luiza|americanas|shopee|shein|aliexpress|wish|casas\s*bahia|ponto\s*frio|kabum|fast\s*shop|renner|riachuelo|c&a|cea\s|zara|hering|marisa|centauro|netshoes|dafiti|decathlon/i, "Compras Online"],
  [/shopping|loja|store|shop\s/i, "Compras"],

  // Educação
  [/escola|faculdade|universidade|curso|udemy|alura|rocketseat|origamid|platzi|coursera|edx|hotmart|kiwify/i, "Educação"],
  [/livro|livraria|saraiva|amazon\s*kindle|kindle/i, "Livros"],

  // Financeiro
  [/seguro|porto\s*seguro|suhai|liberty|tokio|azul\s*seguros|mapfre|hdi/i, "Seguros"],
  [/iof|tarifa|anuidade|juros|multa|taxa/i, "Taxas Bancárias"],
  [/investimento|corretora|xp\s|rico\s|clear\s|nuinvest|btg/i, "Investimentos"],

  // Lazer
  [/cinema|cinemark|cinepolis|uci|ingresso|evento|show|teatro|museu|parque/i, "Lazer"],
  [/viagem|hotel|hostel|airbnb|booking|decolar|latam|gol\s|azul\s|avianca|passagem|passagens/i, "Viagem"],
  [/pet\s*shop|petshop|veterinário|veterinario|cobasi|petz/i, "Pet"],
];

function categorize(description: string): string {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(description)) {
      return category;
    }
  }
  return "Outros";
}

// Parse CSV lines, handling quoted fields
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseDate(value: string): string | null {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const brMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return value;

  return null;
}

function parseAmount(value: string): number | null {
  // Remove currency symbols, spaces
  let cleaned = value.replace(/[R$\s]/g, "").trim();
  // Handle BR format: 1.234,56 → 1234.56
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  // Remove leading + or -
  const negative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/^[+\-]/, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return negative ? -num : num;
}

export function parseCSV(content: string): Expense[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/["\s]/g, ""));

  // Auto-detect columns
  let dateCol = header.findIndex((h) =>
    /^(date|data|dt|vencimento|dt_compra)/.test(h)
  );
  let descCol = header.findIndex((h) =>
    /^(descri|title|titulo|estabelecimento|merchant|nome|lançamento|lancamento|histórico|historico)/.test(h)
  );
  let amountCol = header.findIndex((h) =>
    /^(amount|valor|value|quantia|vlr|preco|preço|montante)/.test(h)
  );

  // Fallback: if header detection fails, try positional
  // Common formats: date, description, amount (3 cols) or date, description, category, amount (4 cols)
  if (dateCol === -1 || descCol === -1 || amountCol === -1) {
    const firstRow = parseCSVLine(lines[1]);
    // Try to detect by content of first data row
    for (let i = 0; i < firstRow.length; i++) {
      if (dateCol === -1 && parseDate(firstRow[i])) {
        dateCol = i;
      } else if (amountCol === -1 && parseAmount(firstRow[i]) !== null && /[\d,.]/.test(firstRow[i])) {
        amountCol = i;
      }
    }
    // Description is the remaining column
    if (descCol === -1) {
      for (let i = 0; i < firstRow.length; i++) {
        if (i !== dateCol && i !== amountCol) {
          descCol = i;
          break;
        }
      }
    }
  }

  if (dateCol === -1 || descCol === -1 || amountCol === -1) return [];

  const expenses: Expense[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length <= Math.max(dateCol, descCol, amountCol)) continue;

    const date = parseDate(fields[dateCol]);
    const description = fields[descCol].replace(/^"|"$/g, "").trim();
    const amount = parseAmount(fields[amountCol]);

    if (!date || !description || amount === null || amount === 0) continue;

    expenses.push({
      date,
      description,
      amount: Math.abs(amount),
      category: categorize(description),
    });
  }

  return expenses.sort((a, b) => b.date.localeCompare(a.date));
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Delivery": "#f97316",
  "Restaurantes": "#ef4444",
  "Supermercado": "#22c55e",
  "Transporte": "#3b82f6",
  "Combustível": "#6366f1",
  "Estacionamento": "#8b5cf6",
  "Pedágio": "#a78bfa",
  "Moradia": "#06b6d4",
  "Energia": "#fbbf24",
  "Água": "#38bdf8",
  "Gás": "#fb923c",
  "Streaming": "#ec4899",
  "Telecom": "#14b8a6",
  "Assinaturas Digitais": "#a855f7",
  "Farmácia": "#10b981",
  "Saúde": "#f43f5e",
  "Academia": "#84cc16",
  "Compras Online": "#f59e0b",
  "Compras": "#d946ef",
  "Educação": "#0ea5e9",
  "Livros": "#64748b",
  "Seguros": "#475569",
  "Taxas Bancárias": "#94a3b8",
  "Investimentos": "#059669",
  "Lazer": "#e879f9",
  "Viagem": "#2dd4bf",
  "Pet": "#a3e635",
  "Outros": "#6b7280",
};

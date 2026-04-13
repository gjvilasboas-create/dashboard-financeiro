export interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
}

export interface HistoricalPrice {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GoalResult {
  months: number;
  timeline: {
    month: number;
    invested: number;
    interest: number;
    total: number;
  }[];
}

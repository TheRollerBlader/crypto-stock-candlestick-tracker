export type Timeframe = '1h' | '4h' | '1d' | '1w';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerInfo {
  symbol: string;
  name: string;
  category: 'crypto' | 'stock';
  binanceSymbol?: string;
  basePrice?: number;
  decimals: number;
}

export interface IndicatorConfig {
  sma: {
    enabled: boolean;
    show20: boolean;
    show50: boolean;
    show200: boolean;
  };
  ema: {
    enabled: boolean;
    show20: boolean;
    show50: boolean;
    show200: boolean;
  };
  bollinger: {
    enabled: boolean;
    period: number;
    multiplier: number;
  };
  volume: {
    enabled: boolean;
  };
  rsi: {
    enabled: boolean;
    period: number;
    overbought: number;
    oversold: number;
  };
  macd: {
    enabled: boolean;
    fast: number;
    slow: number;
    signal: number;
  };
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  category: 'crypto' | 'stock';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  sparkline: number[];
  volatility30d: number; // Annualized volatility in %
}

export interface SeriesPoint {
  time: number;
  value: number;
}

export interface BollingerBandsResult {
  upper: SeriesPoint[];
  middle: SeriesPoint[];
  lower: SeriesPoint[];
}

export interface MACDResult {
  macd: SeriesPoint[];
  signal: SeriesPoint[];
  histogram: {
    time: number;
    value: number;
    color: string;
  }[];
}

export interface CorrelationMatrixResult {
  symbols: string[];
  matrix: number[][];
}

export type ConnectionStatus = 'connected' | 'syncing' | 'cached' | 'error';

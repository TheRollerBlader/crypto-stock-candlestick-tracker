import { Candle, Timeframe, TickerInfo, WatchlistItem } from '../types/market';
import { calculateAnnualizedVolatility } from '../utils/indicators';

export const DEFAULT_TICKERS: TickerInfo[] = [
  // Crypto
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'crypto', binanceSymbol: 'BTCUSDT', basePrice: 67850, decimals: 2 },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'crypto', binanceSymbol: 'ETHUSDT', basePrice: 2540, decimals: 2 },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'crypto', binanceSymbol: 'SOLUSDT', basePrice: 174.5, decimals: 2 },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'crypto', binanceSymbol: 'BNBUSDT', basePrice: 592.0, decimals: 2 },
  { symbol: 'XRPUSDT', name: 'XRP', category: 'crypto', binanceSymbol: 'XRPUSDT', basePrice: 0.538, decimals: 4 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'crypto', binanceSymbol: 'DOGEUSDT', basePrice: 0.142, decimals: 4 },
  { symbol: 'ADAUSDT', name: 'Cardano', category: 'crypto', binanceSymbol: 'ADAUSDT', basePrice: 0.354, decimals: 4 },
  { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'crypto', binanceSymbol: 'AVAXUSDT', basePrice: 27.8, decimals: 2 },

  // Stocks & Indices
  { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'stock', basePrice: 141.54, decimals: 2 },
  { symbol: 'AAPL', name: 'Apple Inc', category: 'stock', basePrice: 231.40, decimals: 2 },
  { symbol: 'MSFT', name: 'Microsoft Corp', category: 'stock', basePrice: 428.15, decimals: 2 },
  { symbol: 'TSLA', name: 'Tesla Inc', category: 'stock', basePrice: 218.50, decimals: 2 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', category: 'stock', basePrice: 165.80, decimals: 2 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', category: 'stock', basePrice: 187.90, decimals: 2 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'stock', basePrice: 582.30, decimals: 2 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'stock', basePrice: 493.60, decimals: 2 },
];

export const AVAILABLE_SYMBOLS = DEFAULT_TICKERS.map((t) => t.symbol);

export const TIMEFRAMES: { id: Timeframe; label: string; seconds: number; binanceInterval: string }[] = [
  { id: '1h', label: '1H', seconds: 3600, binanceInterval: '1h' },
  { id: '4h', label: '4H', seconds: 14400, binanceInterval: '4h' },
  { id: '1d', label: '1D', seconds: 86400, binanceInterval: '1d' },
  { id: '1w', label: '1W', seconds: 604800, binanceInterval: '1w' },
];

/**
 * Deterministic pseudo-random number generator for consistent fallback charts
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generate realistic historical candles using Geometric Brownian Motion with Mean Reversion
 */
export function generateSyntheticCandles(
  ticker: TickerInfo,
  timeframe: Timeframe,
  count: number = 200
): Candle[] {
  const tfConfig = TIMEFRAMES.find((tf) => tf.id === timeframe) || TIMEFRAMES[2];
  const stepSeconds = tfConfig.seconds;

  // Derive stable seed based on symbol and timeframe
  let charCodeSum = 0;
  for (let i = 0; i < ticker.symbol.length; i++) {
    charCodeSum += ticker.symbol.charCodeAt(i) * (i + 1);
  }
  const random = createSeededRandom(charCodeSum + stepSeconds);

  const basePrice = ticker.basePrice || 100;
  const isCrypto = ticker.category === 'crypto';
  const volatility = isCrypto ? 0.025 : 0.012; // Bar volatility

  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const alignedNow = Math.floor(now / stepSeconds) * stepSeconds;
  const startTime = alignedNow - (count - 1) * stepSeconds;

  let currentPrice = basePrice * (0.85 + random() * 0.3);

  for (let i = 0; i < count; i++) {
    const time = startTime + i * stepSeconds;

    // Daily & periodic momentum wave
    const wave = Math.sin(i / 14) * 0.008 + Math.cos(i / 7) * 0.005;
    // Mean reversion force
    const meanReversion = (basePrice - currentPrice) / basePrice * 0.02;

    const u1 = Math.max(0.0001, random());
    const u2 = random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2); // Box-Muller transform

    const returnPct = wave + meanReversion + z0 * volatility;
    const open = currentPrice;
    const close = Math.max(open * 0.01, open * (1 + returnPct));

    const wickUpper = Math.abs(z0) * volatility * open * 0.8 * random();
    const wickLower = Math.abs(z0) * volatility * open * 0.8 * random();

    const high = Math.max(open, close) + wickUpper;
    const low = Math.min(open, close) - wickLower;

    // Volume with correlation to price movement
    const baseVol = isCrypto ? 500000 / open : 10000000 / open;
    const volNoise = 0.5 + random() * 1.5;
    const priceMoveMag = Math.abs(close - open) / open;
    const volume = Math.round(baseVol * volNoise * (1 + priceMoveMag * 8));

    candles.push({
      time,
      open: Number(open.toFixed(ticker.decimals)),
      high: Number(high.toFixed(ticker.decimals)),
      low: Number(low.toFixed(ticker.decimals)),
      close: Number(close.toFixed(ticker.decimals)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Fetch live candles from Binance API with automatic fallback to synthetic high-fidelity data
 */
export async function fetchCandles(
  ticker: TickerInfo,
  timeframe: Timeframe,
  count: number = 250
): Promise<{ candles: Candle[]; source: 'binance' | 'synthetic' }> {
  const tfConfig = TIMEFRAMES.find((tf) => tf.id === timeframe) || TIMEFRAMES[2];

  if (ticker.category === 'crypto' && ticker.binanceSymbol) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${ticker.binanceSymbol}&interval=${tfConfig.binanceInterval}&limit=${count}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const raw = await response.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const candles: Candle[] = raw.map((item: any) => ({
            time: Math.floor(item[0] / 1000), // convert ms to seconds
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));
          return { candles, source: 'binance' };
        }
      }
    } catch {
      // Gracefully fall through to synthetic generator
    }
  }

  // Fallback for stocks, network timeouts, or rate limits
  return {
    candles: generateSyntheticCandles(ticker, timeframe, count),
    source: 'synthetic',
  };
}

/**
 * Generate or fetch watchlist summaries for an array of tickers
 */
export async function fetchWatchlistSummaries(
  tickers: TickerInfo[]
): Promise<WatchlistItem[]> {
  const items: WatchlistItem[] = [];

  // Try fetching 24hr Binance data for batch crypto
  let binance24hrMap: Record<string, any> = {};
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((item) => {
          binance24hrMap[item.symbol] = item;
        });
      }
    }
  } catch {
    // Ignore error and use synthetic calculations
  }

  for (const ticker of tickers) {
    const bData = ticker.binanceSymbol ? binance24hrMap[ticker.binanceSymbol] : null;

    if (bData) {
      const price = parseFloat(bData.lastPrice);
      const change24h = parseFloat(bData.priceChangePercent);
      const high24h = parseFloat(bData.highPrice);
      const low24h = parseFloat(bData.lowPrice);
      const volume24h = parseFloat(bData.volume);

      // Generate 30 daily points for sparkline & volatility
      const candles = generateSyntheticCandles(ticker, '1d', 30);
      // adjust latest candle close to match real price
      if (candles.length > 0) {
        candles[candles.length - 1].close = price;
      }
      const prices = candles.map((c) => c.close);
      const sparkline = prices.slice(-15);
      const volatility30d = calculateAnnualizedVolatility(prices, ticker.category === 'crypto');

      items.push({
        symbol: ticker.symbol,
        name: ticker.name,
        category: ticker.category,
        price,
        change24h,
        high24h,
        low24h,
        volume24h,
        sparkline,
        volatility30d,
      });
    } else {
      // Synthetic computation
      const candles = generateSyntheticCandles(ticker, '1d', 30);
      const latest = candles[candles.length - 1];
      const prev = candles[candles.length - 2] || latest;
      const change24h = Number((((latest.close - prev.close) / prev.close) * 100).toFixed(2));
      const prices = candles.map((c) => c.close);
      const sparkline = prices.slice(-15);
      const volatility30d = calculateAnnualizedVolatility(prices, ticker.category === 'crypto');

      items.push({
        symbol: ticker.symbol,
        name: ticker.name,
        category: ticker.category,
        price: latest.close,
        change24h,
        high24h: latest.high,
        low24h: latest.low,
        volume24h: latest.volume,
        sparkline,
        volatility30d,
      });
    }
  }

  return items;
}

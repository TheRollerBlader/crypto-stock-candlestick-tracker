import {
  Candle,
  SeriesPoint,
  BollingerBandsResult,
  MACDResult,
  CorrelationMatrixResult
} from '../types/market';

/**
 * Calculates Simple Moving Average (SMA)
 * SMA_t = (1/N) * sum_{i=0}^{N-1} P_{t-i}
 */
export function calculateSMA(candles: Candle[], period: number): SeriesPoint[] {
  if (candles.length < period) return [];

  const result: SeriesPoint[] = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;

    if (i >= period) {
      sum -= candles[i - period].close;
    }

    if (i >= period - 1) {
      result.push({
        time: candles[i].time,
        value: Number((sum / period).toFixed(4)),
      });
    }
  }

  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 * Multiplier alpha = 2 / (period + 1)
 * EMA_0 = SMA_first_period
 * EMA_t = Close_t * alpha + EMA_{t-1} * (1 - alpha)
 */
export function calculateEMA(candles: Candle[], period: number): SeriesPoint[] {
  if (candles.length < period) return [];

  const result: SeriesPoint[] = [];
  const alpha = 2 / (period + 1);

  // Compute initial SMA as seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEMA = sum / period;

  result.push({
    time: candles[period - 1].time,
    value: Number(prevEMA.toFixed(4)),
  });

  for (let i = period; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    prevEMA = currentPrice * alpha + prevEMA * (1 - alpha);
    result.push({
      time: candles[i].time,
      value: Number(prevEMA.toFixed(4)),
    });
  }

  return result;
}

/**
 * Calculates Bollinger Bands (Upper, Middle, Lower)
 * Middle = SMA(period)
 * StdDev = sqrt( (1/N) * sum((P - SMA)^2) )
 * Upper = Middle + multiplier * StdDev
 * Lower = Middle - multiplier * StdDev
 */
export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  multiplier: number = 2
): BollingerBandsResult {
  if (candles.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const upper: SeriesPoint[] = [];
  const middle: SeriesPoint[] = [];
  const lower: SeriesPoint[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const sum = window.reduce((acc, c) => acc + c.close, 0);
    const mean = sum / period;

    const variance = window.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = candles[i].time;
    middle.push({ time, value: Number(mean.toFixed(4)) });
    upper.push({ time, value: Number((mean + multiplier * stdDev).toFixed(4)) });
    lower.push({ time, value: Number((mean - multiplier * stdDev).toFixed(4)) });
  }

  return { upper, middle, lower };
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's Smoothing Technique
 * U = max(delta, 0), D = max(-delta, 0)
 * AvgGain_t = (AvgGain_{t-1} * (N-1) + U_t) / N
 * AvgLoss_t = (AvgLoss_{t-1} * (N-1) + D_t) / N
 * RS = AvgGain / AvgLoss
 * RSI = 100 - (100 / (1 + RS))
 */
export function calculateRSI(candles: Candle[], period: number = 14): SeriesPoint[] {
  if (candles.length <= period) return [];

  const result: SeriesPoint[] = [];
  let gains = 0;
  let losses = 0;

  // First period average gain / loss
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

  result.push({
    time: candles[period].time,
    value: Number(rsi.toFixed(2)),
  });

  // Wilder's recursive smoothing
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    result.push({
      time: candles[i].time,
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * MACD Line = EMA(fast) - EMA(slow)
 * Signal Line = EMA(signal) of MACD Line
 * Histogram = MACD Line - Signal Line
 */
export function calculateMACD(
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (candles.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  // Align fastEMA with slowEMA timestamps
  const slowTimeMap = new Map<number, number>();
  slowEMA.forEach((pt) => slowTimeMap.set(pt.time, pt.value));

  const macdLinePoints: SeriesPoint[] = [];

  for (const fastPt of fastEMA) {
    const slowVal = slowTimeMap.get(fastPt.time);
    if (slowVal !== undefined) {
      macdLinePoints.push({
        time: fastPt.time,
        value: Number((fastPt.value - slowVal).toFixed(4)),
      });
    }
  }

  if (macdLinePoints.length < signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  // Calculate Signal line: EMA of MACD Line points
  const alphaSignal = 2 / (signalPeriod + 1);
  let sumMacd = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sumMacd += macdLinePoints[i].value;
  }
  let prevSignal = sumMacd / signalPeriod;

  const signalPoints: SeriesPoint[] = [];
  const histPoints: { time: number; value: number; color: string }[] = [];

  signalPoints.push({
    time: macdLinePoints[signalPeriod - 1].time,
    value: Number(prevSignal.toFixed(4)),
  });

  const firstHistVal = Number((macdLinePoints[signalPeriod - 1].value - prevSignal).toFixed(4));
  histPoints.push({
    time: macdLinePoints[signalPeriod - 1].time,
    value: firstHistVal,
    color: firstHistVal >= 0 ? '#10b981' : '#f43f5e',
  });

  for (let i = signalPeriod; i < macdLinePoints.length; i++) {
    const macdVal = macdLinePoints[i].value;
    prevSignal = macdVal * alphaSignal + prevSignal * (1 - alphaSignal);

    const histVal = Number((macdVal - prevSignal).toFixed(4));
    const time = macdLinePoints[i].time;

    signalPoints.push({
      time,
      value: Number(prevSignal.toFixed(4)),
    });

    histPoints.push({
      time,
      value: histVal,
      color: histVal >= 0 ? '#10b981' : '#f43f5e',
    });
  }

  return {
    macd: macdLinePoints.slice(signalPeriod - 1),
    signal: signalPoints,
    histogram: histPoints,
  };
}

/**
 * Calculates periodic returns: r_t = (P_t - P_{t-1}) / P_{t-1}
 */
export function calculateReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] === 0) returns.push(0);
    else returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/**
 * Calculates Annualized Volatility
 * sigma_ann = sigma_daily * sqrt(annualFactor) * 100%
 */
export function calculateAnnualizedVolatility(
  prices: number[],
  isCrypto: boolean = true
): number {
  const returns = calculateReturns(prices);
  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  const annualFactor = isCrypto ? 365 : 252;
  const annualized = stdDev * Math.sqrt(annualFactor) * 100;
  return Number(annualized.toFixed(2));
}

/**
 * Calculates Pearson Correlation Matrix between multiple asset return vectors
 * r_{xy} = sum((x - mx)(y - my)) / (sqrt(sum((x - mx)^2)) * sqrt(sum((y - my)^2)))
 */
export function calculateCorrelationMatrix(
  assetReturnsMap: Record<string, number[]>
): CorrelationMatrixResult {
  const symbols = Object.keys(assetReturnsMap);
  const n = symbols.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(1));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
        continue;
      }

      const x = assetReturnsMap[symbols[i]];
      const y = assetReturnsMap[symbols[j]];

      const len = Math.min(x.length, y.length);
      if (len < 3) {
        matrix[i][j] = 0;
        matrix[j][i] = 0;
        continue;
      }

      const xSlice = x.slice(x.length - len);
      const ySlice = y.slice(y.length - len);

      const meanX = xSlice.reduce((a, b) => a + b, 0) / len;
      const meanY = ySlice.reduce((a, b) => a + b, 0) / len;

      let num = 0;
      let denomX = 0;
      let denomY = 0;

      for (let k = 0; k < len; k++) {
        const dx = xSlice[k] - meanX;
        const dy = ySlice[k] - meanY;
        num += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
      }

      const denom = Math.sqrt(denomX * denomY);
      const corr = denom === 0 ? 0 : Number((num / denom).toFixed(3));
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }

  return { symbols, matrix };
}

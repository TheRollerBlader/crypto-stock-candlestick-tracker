import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateReturns,
  calculateAnnualizedVolatility,
  calculateCorrelationMatrix,
} from '../src/utils/indicators';
import { Candle } from '../src/types/market';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

function runValidationTests() {
  console.log('=== STARTING QUANTITATIVE BENCHMARK & ACCURACY TESTS ===\n');

  // Test 1: SMA Accuracy
  const dummyCandles: Candle[] = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((p, i) => ({
    time: 1000 + i * 60,
    open: p,
    high: p + 1,
    low: p - 1,
    close: p,
    volume: 100,
  }));

  const sma5 = calculateSMA(dummyCandles, 5);
  // First 5 elements [10, 11, 12, 13, 14] -> avg = 60/5 = 12
  assert(sma5.length === 6, 'SMA5 returns expected number of elements (10 - 5 + 1 = 6)');
  assert(Math.abs(sma5[0].value - 12.0) < 0.001, `SMA5 seed is 12.0 (got ${sma5[0].value})`);
  // Last 5 elements [15, 16, 17, 18, 19] -> avg = 85/5 = 17
  assert(Math.abs(sma5[5].value - 17.0) < 0.001, `SMA5 final is 17.0 (got ${sma5[5].value})`);

  // Test 2: EMA Accuracy
  const ema5 = calculateEMA(dummyCandles, 5);
  // Alpha = 2 / (5 + 1) = 2/6 = 0.3333...
  assert(ema5.length === 6, 'EMA5 returns expected length');
  assert(Math.abs(ema5[0].value - 12.0) < 0.001, `EMA5 seed matches SMA (12.0)`);
  // Next point: close=15, alpha=1/3 -> 15*(1/3) + 12*(2/3) = 5 + 8 = 13.0
  assert(Math.abs(ema5[1].value - 13.0) < 0.01, `EMA5 recursive step matches (13.0, got ${ema5[1].value})`);

  // Test 3: Bollinger Bands
  const bb = calculateBollingerBands(dummyCandles, 5, 2);
  assert(bb.middle.length === 6, 'Bollinger Bands middle matches SMA length');
  // For [10, 11, 12, 13, 14], mean = 12, variance = (4+1+0+1+4)/5 = 2, stdDev = sqrt(2) ≈ 1.4142
  // Upper = 12 + 2*1.4142 = 14.8284, Lower = 12 - 2*1.4142 = 9.1716
  assert(Math.abs(bb.upper[0].value - 14.8284) < 0.05, `Bollinger upper band matches theoretical 14.83`);
  assert(Math.abs(bb.lower[0].value - 9.1716) < 0.05, `Bollinger lower band matches theoretical 9.17`);

  // Test 4: RSI Overbought & Oversold
  // Bullish rally candles -> RSI should exceed 70
  const bullCandles: Candle[] = Array.from({ length: 30 }, (_, i) => ({
    time: 1000 + i * 60,
    open: 100 + i * 2,
    high: 100 + i * 2 + 1,
    low: 100 + i * 2 - 0.5,
    close: 100 + (i + 1) * 2,
    volume: 500,
  }));
  const rsiBull = calculateRSI(bullCandles, 14);
  const latestBullRSI = rsiBull[rsiBull.length - 1].value;
  assert(latestBullRSI > 85, `Bullish consecutive rally RSI exceeds 85 (got ${latestBullRSI})`);

  // Bearish plunge candles -> RSI should plunge below 30
  const bearCandles: Candle[] = Array.from({ length: 30 }, (_, i) => ({
    time: 1000 + i * 60,
    open: 100 - i * 2,
    high: 100 - i * 2 + 0.5,
    low: 100 - i * 2 - 2,
    close: 100 - (i + 1) * 2,
    volume: 500,
  }));
  const rsiBear = calculateRSI(bearCandles, 14);
  const latestBearRSI = rsiBear[rsiBear.length - 1].value;
  assert(latestBearRSI < 15, `Bearish plunge RSI drops below 15 (got ${latestBearRSI})`);

  // Test 5: MACD Crossover & Convergence
  const longSeries: Candle[] = Array.from({ length: 60 }, (_, i) => ({
    time: 1000 + i * 60,
    open: 100 + Math.sin(i / 5) * 15,
    high: 100 + Math.sin(i / 5) * 15 + 1,
    low: 100 + Math.sin(i / 5) * 15 - 1,
    close: 100 + Math.sin(i / 5) * 15,
    volume: 1000,
  }));
  const macd = calculateMACD(longSeries, 12, 26, 9);
  assert(macd.macd.length > 0, 'MACD Line computed');
  assert(macd.signal.length > 0, 'Signal Line computed');
  assert(macd.histogram.length === macd.signal.length, 'Histogram aligns with Signal Line');

  // Test 6: Pearson Correlation Matrix
  const seriesA = [0.01, 0.02, -0.01, 0.03, -0.02, 0.04, 0.01];
  const seriesB = [0.01, 0.02, -0.01, 0.03, -0.02, 0.04, 0.01]; // Perfect positive
  const seriesC = [-0.01, -0.02, 0.01, -0.03, 0.02, -0.04, -0.01]; // Perfect inverse

  const corrRes = calculateCorrelationMatrix({
    A: seriesA,
    B: seriesB,
    C: seriesC,
  });

  assert(corrRes.matrix[0][0] === 1.0, 'Correlation self-identity is 1.000');
  assert(Math.abs(corrRes.matrix[0][1] - 1.0) < 0.001, 'Identical series correlation r(A,B) = +1.000');
  assert(Math.abs(corrRes.matrix[0][2] - (-1.0)) < 0.001, 'Inversely mirrored series correlation r(A,C) = -1.000');

  // Test 7: Annualized Volatility
  const volCrypto = calculateAnnualizedVolatility([100, 102, 101, 105, 103, 107], true);
  assert(volCrypto > 0, `Crypto annualized volatility is positive (${volCrypto}%)`);

  // Test 8: Performance Benchmark
  console.log('\n--- PERFORMANCE BENCHMARK (10,000 CANDLES) ---');
  const largeCandleSet: Candle[] = Array.from({ length: 10000 }, (_, i) => ({
    time: i,
    open: 100 + (i % 50),
    high: 105 + (i % 50),
    low: 95 + (i % 50),
    close: 102 + (i % 50),
    volume: 1000,
  }));

  const start = performance.now();
  calculateSMA(largeCandleSet, 50);
  calculateEMA(largeCandleSet, 50);
  calculateBollingerBands(largeCandleSet, 20, 2);
  calculateRSI(largeCandleSet, 14);
  calculateMACD(largeCandleSet, 12, 26, 9);
  const elapsed = performance.now() - start;

  console.log(`⏱️ Computed 5 full indicator sets across 10,000 bars in: ${elapsed.toFixed(2)} ms`);
  assert(elapsed < 60, `High performance indicator engine execution (< 60ms)`);

  console.log('\n🌟 ALL QUANTITATIVE VALIDATION BENCHMARKS PASSED PERFECTLY!\n');
}

runValidationTests();

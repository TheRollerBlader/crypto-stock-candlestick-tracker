import React from 'react';
import { Candle, TickerInfo } from '../types/market';
import { formatCurrency, formatVolume } from '../utils/formatters';

interface TerminalStatsProps {
  ticker: TickerInfo;
  candles: Candle[];
}

export const TerminalStats: React.FC<TerminalStatsProps> = ({ ticker, candles }) => {
  if (candles.length === 0) return null;

  const latest = candles[candles.length - 1];
  const last24Candles = candles.slice(-24);

  const high24 = Math.max(...last24Candles.map((c) => c.high));
  const low24 = Math.min(...last24Candles.map((c) => c.low));
  const volume24 = last24Candles.reduce((acc, c) => acc + c.volume, 0);

  const rangeDollar = high24 - low24;
  const rangePct = low24 > 0 ? (rangeDollar / low24) * 100 : 0;

  // True Range for ATR estimate
  let trSum = 0;
  for (let i = 1; i < Math.min(14, candles.length); i++) {
    const curr = candles[candles.length - i];
    const prev = candles[candles.length - i - 1];
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trSum += tr;
  }
  const atr14 = trSum / Math.min(14, candles.length - 1 || 1);

  // Position within 24h range
  const rangePosPct = rangeDollar > 0 ? ((latest.close - low24) / rangeDollar) * 100 : 50;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
      {/* 24h High */}
      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
        <div className="text-slate-500 text-[10px] uppercase font-semibold">24h High</div>
        <div className="text-slate-200 font-bold font-mono-numbers mt-0.5">
          {formatCurrency(high24, ticker.decimals)}
        </div>
      </div>

      {/* 24h Low */}
      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
        <div className="text-slate-500 text-[10px] uppercase font-semibold">24h Low</div>
        <div className="text-slate-200 font-bold font-mono-numbers mt-0.5">
          {formatCurrency(low24, ticker.decimals)}
        </div>
      </div>

      {/* 24h Range Bar */}
      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
          <span>24h Range</span>
          <span className="text-cyan-400 font-bold">{rangePct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
            style={{ width: `${Math.min(100, Math.max(5, rangePosPct))}%` }}
          />
        </div>
      </div>

      {/* 24h Volume */}
      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
        <div className="text-slate-500 text-[10px] uppercase font-semibold">24h Volume</div>
        <div className="text-slate-200 font-bold font-mono-numbers mt-0.5">
          {formatVolume(volume24)}
        </div>
      </div>

      {/* 14-period ATR */}
      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
        <div className="text-slate-500 text-[10px] uppercase font-semibold">ATR (14)</div>
        <div className="text-amber-400 font-bold font-mono-numbers mt-0.5">
          {formatCurrency(atr14, ticker.decimals)}
        </div>
      </div>

      {/* Category & Status */}
      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
        <div className="text-slate-500 text-[10px] uppercase font-semibold">Market Regime</div>
        <div className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE TRADING
        </div>
      </div>
    </div>
  );
};

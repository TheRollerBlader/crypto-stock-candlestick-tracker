import React from 'react';
import { WatchlistItem } from '../types/market';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Flame } from 'lucide-react';

interface VolatilityHeatmapProps {
  items: WatchlistItem[];
  onSelectTicker: (symbol: string) => void;
}

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({
  items,
  onSelectTicker,
}) => {
  // Sort items by volatility descending
  const sorted = [...items].sort((a, b) => b.volatility30d - a.volatility30d);

  const maxVol = Math.max(...items.map((i) => i.volatility30d), 100);
  const minVol = Math.min(...items.map((i) => i.volatility30d), 10);
  const avgVol = items.reduce((acc, i) => acc + i.volatility30d, 0) / (items.length || 1);

  // Helper for background heat gradient
  const getHeatBg = (vol: number) => {
    if (vol >= 80) return 'from-rose-950/80 to-rose-900/40 border-rose-600/50 text-rose-300';
    if (vol >= 55) return 'from-amber-950/80 to-amber-900/40 border-amber-600/50 text-amber-300';
    if (vol >= 35) return 'from-yellow-950/80 to-yellow-900/40 border-yellow-600/40 text-yellow-300';
    return 'from-emerald-950/80 to-teal-900/40 border-teal-600/40 text-teal-300';
  };

  const getRegimeBadge = (vol: number) => {
    if (vol >= 80) return { label: 'EXTREME', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (vol >= 55) return { label: 'ELEVATED', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (vol >= 35) return { label: 'MODERATE', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'LOW', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-mono font-bold text-slate-100">
              Cross-Asset Volatility Heatmap
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Annualized 30-day historical standard deviation of log returns (σ_ann = σ_daily × √N)
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Benchmark Avg:</span>{' '}
            <span className="text-cyan-400 font-bold font-mono-numbers">{avgVol.toFixed(1)}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Max Vol:</span>{' '}
            <span className="text-rose-400 font-bold font-mono-numbers">{maxVol.toFixed(1)}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Min Vol:</span>{' '}
            <span className="text-teal-400 font-bold font-mono-numbers">{minVol.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {sorted.map((item) => {
          const heatStyle = getHeatBg(item.volatility30d);
          const regime = getRegimeBadge(item.volatility30d);
          const isPos = item.change24h >= 0;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectTicker(item.symbol)}
              className={`p-4 rounded-xl border bg-gradient-to-br transition-all hover:scale-[1.02] cursor-pointer shadow-sm ${heatStyle}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-mono font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    {item.symbol}
                    <span className="text-[10px] text-slate-400 font-normal">({item.category})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    {item.name}
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${regime.color}`}>
                  {regime.label}
                </span>
              </div>

              {/* Volatility Metric Callout */}
              <div className="my-3 flex items-baseline justify-between border-t border-b border-slate-800/60 py-2">
                <span className="text-xs text-slate-400 font-mono">30D Ann. Vol:</span>
                <span className="text-xl font-mono font-bold font-mono-numbers text-slate-100">
                  {item.volatility30d.toFixed(1)}%
                </span>
              </div>

              {/* Price & 24h Change */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-mono-numbers">
                  {formatCurrency(item.price)}
                </span>
                <span className={`font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent(item.change24h)}
                </span>
              </div>

              {/* Visual Relative Gauge Bar */}
              <div className="w-full bg-slate-950/60 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, (item.volatility30d / 120) * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Volatility Regime Legend */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <span className="font-semibold text-slate-300">Regime Definitions:</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-500" />
            <span>Low (&lt;35%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-yellow-500" />
            <span>Moderate (35-55%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>Elevated (55-80%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>Extreme (&gt;80%)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

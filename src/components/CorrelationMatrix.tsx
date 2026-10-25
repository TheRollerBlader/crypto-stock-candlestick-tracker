import React, { useState } from 'react';
import { WatchlistItem } from '../types/market';
import { calculateCorrelationMatrix, calculateReturns } from '../utils/indicators';
import { Network, Info } from 'lucide-react';

interface CorrelationMatrixProps {
  items: WatchlistItem[];
  onSelectTicker: (symbol: string) => void;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  items,
  onSelectTicker,
}) => {
  const [hoveredPair, setHoveredPair] = useState<{
    symA: string;
    symB: string;
    r: number;
  } | null>(null);

  // Build returns dictionary for correlation calculation
  const assetReturnsMap: Record<string, number[]> = {};
  items.forEach((item) => {
    // Generate returns from sparkline data
    assetReturnsMap[item.symbol] = calculateReturns(item.sparkline);
  });

  const { symbols, matrix } = calculateCorrelationMatrix(assetReturnsMap);

  // Color mapper for Pearson correlation (-1 to +1)
  const getCorrelationColor = (r: number, isDiagonal: boolean) => {
    if (isDiagonal) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold';

    if (r >= 0.7) return 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 font-semibold';
    if (r >= 0.4) return 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30';
    if (r >= 0.1) return 'bg-teal-950/40 text-teal-300 border-teal-800/30';
    if (r > -0.1) return 'bg-slate-800/40 text-slate-400 border-slate-700/30';
    if (r > -0.4) return 'bg-orange-950/40 text-orange-300 border-orange-800/30';
    if (r > -0.7) return 'bg-rose-900/30 text-rose-400 border-rose-700/30';
    return 'bg-rose-600/40 text-rose-200 border-rose-500/50 font-semibold';
  };

  const getInterpretation = (r: number, a: string, b: string) => {
    if (a === b) return 'Self-identity correlation (perfect sync).';
    if (r >= 0.75) return `High positive co-movement. Holding both ${a} and ${b} provides low diversification.`;
    if (r >= 0.4) return `Moderate positive correlation. Tendency to trend in the same direction.`;
    if (r > -0.2 && r < 0.2) return `Uncorrelated / orthogonal price behavior. Excellent diversification pair.`;
    if (r <= -0.4) return `Inverse relationship. Favorable for hedging and risk mitigation.`;
    return `Weak negative correlation.`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-mono font-bold text-slate-100">
              Pearson Asset Correlation Matrix (r_xy)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical normalized covariance between daily return series: r = Σ((X - μX)(Y - μY)) / (σX · σY)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Divergence:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" title="Strong Inverse (-1.0)" />
            <span className="text-[10px] text-slate-400">-1.0</span>
            <span className="w-2.5 h-2.5 rounded bg-slate-700" title="Uncorrelated (0.0)" />
            <span className="text-[10px] text-slate-400">0.0</span>
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" title="Strong Positive (+1.0)" />
            <span className="text-[10px] text-slate-400">+1.0</span>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto pb-2">
        <table className="min-w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-500 uppercase tracking-wider text-[11px] bg-slate-950/60 border border-slate-800 sticky left-0 z-10">
                Asset
              </th>
              {symbols.map((sym) => (
                <th
                  key={sym}
                  className="p-2 text-center text-slate-300 font-semibold bg-slate-950/60 border border-slate-800 min-w-[70px]"
                >
                  <button
                    onClick={() => onSelectTicker(sym)}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    {sym}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map((symRow, rowIdx) => (
              <tr key={symRow} className="hover:bg-slate-850/50">
                <td className="p-2 text-slate-200 font-bold bg-slate-950/60 border border-slate-800 sticky left-0 z-10 whitespace-nowrap">
                  <button
                    onClick={() => onSelectTicker(symRow)}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    {symRow}
                  </button>
                </td>
                {symbols.map((symCol, colIdx) => {
                  const r = matrix[rowIdx][colIdx];
                  const isDiag = rowIdx === colIdx;
                  const colorClass = getCorrelationColor(r, isDiag);

                  return (
                    <td
                      key={`${symRow}-${symCol}`}
                      onMouseEnter={() =>
                        setHoveredPair({ symA: symRow, symB: symCol, r })
                      }
                      onMouseLeave={() => setHoveredPair(null)}
                      className={`p-2.5 text-center border border-slate-800/80 transition-all font-mono-numbers cursor-pointer hover:ring-1 hover:ring-cyan-400 ${colorClass}`}
                    >
                      {r.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Inspection Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div>
          {hoveredPair ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">
                  {hoveredPair.symA} / {hoveredPair.symB}
                </span>
                <span className="text-cyan-400 font-semibold font-mono-numbers">
                  r = {hoveredPair.r.toFixed(3)}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {getInterpretation(hoveredPair.r, hoveredPair.symA, hoveredPair.symB)}
              </p>
            </div>
          ) : (
            <p className="text-slate-500">
              Hover over any correlation coefficient cell above to inspect paired asset co-movement and portfolio diversification impact.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

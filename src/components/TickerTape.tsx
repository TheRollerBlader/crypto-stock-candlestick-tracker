import React from 'react';
import { WatchlistItem, TickerInfo } from '../types/market';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface TickerTapeProps {
  items: WatchlistItem[];
  currentTicker: TickerInfo;
  onSelectTicker: (symbol: string) => void;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  items,
  currentTicker,
  onSelectTicker,
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800/80 px-2 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2 text-[10px] uppercase font-mono font-bold text-slate-500 whitespace-nowrap border-r border-slate-800 pr-3">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        Market Tape
      </div>

      <div className="flex items-center gap-3">
        {items.map((item) => {
          const isSelected = item.symbol === currentTicker.symbol;
          const isPos = item.change24h >= 0;

          return (
            <button
              key={item.symbol}
              onClick={() => onSelectTicker(item.symbol)}
              className={`flex items-center gap-2 px-2 py-0.5 rounded text-xs transition-all whitespace-nowrap font-mono ${
                isSelected
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="font-semibold text-slate-200">{item.symbol}</span>
              <span className="text-slate-400 font-mono-numbers">
                {formatCurrency(item.price)}
              </span>
              <span className={`text-[11px] font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPercent(item.change24h)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

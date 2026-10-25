import React, { useState } from 'react';
import { WatchlistItem, TickerInfo } from '../types/market';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';
import { DEFAULT_TICKERS } from '../services/marketData';

interface WatchlistProps {
  items: WatchlistItem[];
  currentTicker: TickerInfo;
  onSelectTicker: (symbol: string) => void;
  onAddTicker: (ticker: TickerInfo) => void;
  onRemoveTicker: (symbol: string) => void;
}

// Mini SVG Sparkline Component
const Sparkline: React.FC<{ data: number[]; isPositive: boolean }> = ({ data, isPositive }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 64;
  const height = 24;
  const padding = 2;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const Watchlist: React.FC<WatchlistProps> = ({
  items,
  currentTicker,
  onSelectTicker,
  onAddTicker,
  onRemoveTicker,
}) => {
  const [search, setSearch] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');

  const currentSymbols = new Set(items.map((i) => i.symbol));

  const filteredItems = items.filter(
    (item) =>
      item.symbol.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableToAdd = DEFAULT_TICKERS.filter((t) => !currentSymbols.has(t.symbol));

  const handleAddPreset = (ticker: TickerInfo) => {
    onAddTicker(ticker);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;

    const sym = customSymbol.trim().toUpperCase();
    if (currentSymbols.has(sym)) {
      setCustomSymbol('');
      return;
    }

    const isCrypto = sym.endsWith('USDT') || sym.length > 5;
    const newTicker: TickerInfo = {
      symbol: sym,
      name: sym,
      category: isCrypto ? 'crypto' : 'stock',
      binanceSymbol: isCrypto ? sym : undefined,
      basePrice: 100,
      decimals: 2,
    };

    onAddTicker(newTicker);
    setCustomSymbol('');
    setShowAddMenu(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg flex flex-col h-full max-h-[850px] overflow-hidden">
      {/* Header & Search */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Watchlist
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
              {items.length}
            </span>
          </div>

          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              showAddMenu
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 pl-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70"
          />
        </div>
      </div>

      {/* Add Ticker Popover */}
      {showAddMenu && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs">
          <div className="mb-2 text-slate-400 font-mono text-[11px]">Available Presets:</div>
          <div className="flex flex-wrap gap-1.5 mb-3 max-h-28 overflow-y-auto">
            {availableToAdd.length === 0 ? (
              <span className="text-slate-500 text-xs italic">All presets added</span>
            ) : (
              availableToAdd.map((ticker) => (
                <button
                  key={ticker.symbol}
                  onClick={() => handleAddPreset(ticker)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950/80 hover:text-cyan-300 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  {ticker.symbol}
                </button>
              ))
            )}
          </div>

          <form onSubmit={handleAddCustom} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Custom Symbol (e.g. ADAUSDT)"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Add
            </button>
          </form>
        </div>
      )}

      {/* List items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No watchlist assets match "{search}"
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.symbol === currentTicker.symbol;
            const isPos = item.change24h >= 0;

            return (
              <div
                key={item.symbol}
                className={`group flex items-center justify-between p-2.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                    : 'hover:bg-slate-800/50'
                }`}
                onClick={() => onSelectTicker(item.symbol)}
              >
                {/* Left: Symbol & Name */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-slate-100 truncate">
                      {item.symbol}
                    </span>
                    <span className={`text-[9px] px-1 rounded uppercase font-mono ${
                      item.category === 'crypto'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {item.category === 'crypto' ? 'C' : 'S'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{item.name}</div>
                </div>

                {/* Middle: Sparkline */}
                <div className="hidden sm:block px-2">
                  <Sparkline data={item.sparkline} isPositive={isPos} />
                </div>

                {/* Right: Price & Change */}
                <div className="text-right pl-2 flex flex-col items-end">
                  <div className="font-mono-numbers text-xs font-semibold text-slate-200">
                    {formatCurrency(item.price)}
                  </div>
                  <div
                    className={`flex items-center gap-0.5 text-[11px] font-mono font-medium ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{formatPercent(item.change24h)}</span>
                  </div>
                </div>

                {/* Delete button (only show on hover if not the last item) */}
                {items.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTicker(item.symbol);
                    }}
                    title="Remove from watchlist"
                    className="opacity-0 group-hover:opacity-100 ml-1.5 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer statistics */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <span>Avg Volatility:</span>
        <span className="text-cyan-400 font-semibold font-mono-numbers">
          {(
            items.reduce((acc, i) => acc + (i.volatility30d || 0), 0) /
            (items.length || 1)
          ).toFixed(1)}
          %
        </span>
      </div>
    </div>
  );
};

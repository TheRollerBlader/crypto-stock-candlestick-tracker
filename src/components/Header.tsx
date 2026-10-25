import React from 'react';
import {
  Activity,
  RefreshCw,
  Sun,
  Moon,
  BookOpen,
  SlidersHorizontal,
  Wifi,
  Sparkles,
  Layers
} from 'lucide-react';
import { ConnectionStatus, TickerInfo } from '../types/market';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface HeaderProps {
  currentTicker: TickerInfo;
  latestPrice: number;
  change24h: number;
  connectionStatus: ConnectionStatus;
  refreshCountdown: number;
  maxCountdown: number;
  isAutoRefreshActive: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenIndicatorsModal: () => void;
  onOpenDocsModal: () => void;
  activeViewTab: 'dashboard' | 'heatmap' | 'correlation';
  onChangeViewTab: (tab: 'dashboard' | 'heatmap' | 'correlation') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTicker,
  latestPrice,
  change24h,
  connectionStatus,
  refreshCountdown,
  maxCountdown,
  isAutoRefreshActive,
  onToggleAutoRefresh,
  onManualRefresh,
  theme,
  onToggleTheme,
  onOpenIndicatorsModal,
  onOpenDocsModal,
  activeViewTab,
  onChangeViewTab,
}) => {
  const isPositive = change24h >= 0;
  const progressPercent = ((maxCountdown - refreshCountdown) / maxCountdown) * 100;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Active Ticker */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider text-sm bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                APEX // TERMINAL
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono uppercase tracking-wider">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Quantitative Candlestick Analytics</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Current Asset Overview */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-base text-slate-100">{currentTicker.symbol}</span>
            <span className="text-xs text-slate-400 font-medium hidden md:inline">({currentTicker.name})</span>
            <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-mono font-semibold ${
              currentTicker.category === 'crypto'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}>
              {currentTicker.category}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-mono-numbers font-semibold text-base text-slate-100">
              {formatCurrency(latestPrice, currentTicker.decimals)}
            </span>
            <span className={`font-mono-numbers text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {formatPercent(change24h)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => onChangeViewTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            activeViewTab === 'dashboard'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Chart & Terminal</span>
        </button>
        <button
          onClick={() => onChangeViewTab('heatmap')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            activeViewTab === 'heatmap'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Volatility Heatmap</span>
        </button>
        <button
          onClick={() => onChangeViewTab('correlation')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            activeViewTab === 'correlation'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Correlation Matrix</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Connection status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/60 border border-slate-800 text-xs font-mono">
          <Wifi className={`w-3.5 h-3.5 ${connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-400">FEED:</span>
          <span className={connectionStatus === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {connectionStatus === 'connected' ? 'BINANCE LIVE' : 'SYNTH/CACHED'}
          </span>
        </div>

        {/* Countdown & Refresh */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/80 border border-slate-800">
          <button
            onClick={onToggleAutoRefresh}
            title={isAutoRefreshActive ? 'Pause auto-refresh' : 'Resume auto-refresh'}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white"
          >
            {/* Circular mini progress */}
            <div className="relative w-4 h-4 flex items-center justify-center">
              <svg className="w-4 h-4 -rotate-90">
                <circle cx="8" cy="8" r="6" stroke="#334155" strokeWidth="2" fill="none" />
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray={37.7}
                  strokeDashoffset={37.7 - (37.7 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-cyan-400 font-bold">{refreshCountdown}s</span>
          </button>

          <button
            onClick={onManualRefresh}
            title="Refresh now"
            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicator overlays modal button */}
        <button
          onClick={onOpenIndicatorsModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Configure Technical Indicators"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Indicators</span>
        </button>

        {/* Documentation / Mathematical formulas */}
        <button
          onClick={onOpenDocsModal}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Technical Documentation & Formulas"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>
      </div>
    </header>
  );
};

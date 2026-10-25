import React, { useState, useEffect, useCallback } from 'react';
import {
  Candle,
  Timeframe,
  TickerInfo,
  IndicatorConfig,
  WatchlistItem,
  ConnectionStatus,
} from './types/market';
import {
  DEFAULT_TICKERS,
  fetchCandles,
  fetchWatchlistSummaries,
} from './services/marketData';
import { Header } from './components/Header';
import { TickerTape } from './components/TickerTape';
import { CandlestickChart } from './components/CandlestickChart';
import { RSIPanel } from './components/RSIPanel';
import { MACDPanel } from './components/MACDPanel';
import { Watchlist } from './components/Watchlist';
import { VolatilityHeatmap } from './components/VolatilityHeatmap';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { IndicatorsModal } from './components/IndicatorsModal';
import { DocsModal } from './components/DocsModal';
import { TerminalStats } from './components/TerminalStats';

const DEFAULT_INDICATORS: IndicatorConfig = {
  sma: {
    enabled: true,
    show20: true,
    show50: true,
    show200: false,
  },
  ema: {
    enabled: false,
    show20: true,
    show50: false,
    show200: false,
  },
  bollinger: {
    enabled: true,
    period: 20,
    multiplier: 2,
  },
  volume: {
    enabled: true,
  },
  rsi: {
    enabled: true,
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  macd: {
    enabled: true,
    fast: 12,
    slow: 26,
    signal: 9,
  },
};

const COUNTDOWN_INTERVAL = 10; // seconds

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('apex_terminal_theme') as 'dark' | 'light') || 'dark';
  });

  // Watchlist & Tickers state
  const [activeTickers, setActiveTickers] = useState<TickerInfo[]>(() => {
    const saved = localStorage.getItem('apex_watchlist_symbols_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_TICKERS.slice(0, 8);
  });

  const [currentTicker, setCurrentTicker] = useState<TickerInfo>(activeTickers[0] || DEFAULT_TICKERS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('syncing');

  // Indicators state
  const [indicators, setIndicators] = useState<IndicatorConfig>(() => {
    const saved = localStorage.getItem('apex_indicator_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_INDICATORS;
  });

  // Navigation & Modals
  const [activeViewTab, setActiveViewTab] = useState<'dashboard' | 'heatmap' | 'correlation'>('dashboard');
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Auto-refresh timer state
  const [countdown, setCountdown] = useState(COUNTDOWN_INTERVAL);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(true);

  // Sync theme with document element
  useEffect(() => {
    localStorage.setItem('apex_terminal_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist watchlist and indicators
  useEffect(() => {
    localStorage.setItem('apex_watchlist_symbols_v2', JSON.stringify(activeTickers));
  }, [activeTickers]);

  useEffect(() => {
    localStorage.setItem('apex_indicator_config', JSON.stringify(indicators));
  }, [indicators]);

  // Load candle data for current active ticker
  const loadMarketData = useCallback(async () => {
    setConnectionStatus('syncing');
    try {
      const { candles: newCandles, source } = await fetchCandles(currentTicker, timeframe, 200);
      setCandles(newCandles);
      setConnectionStatus(source === 'binance' ? 'connected' : 'cached');
    } catch {
      setConnectionStatus('cached');
    }
  }, [currentTicker, timeframe]);

  // Load watchlist summaries
  const loadWatchlist = useCallback(async () => {
    try {
      const summaries = await fetchWatchlistSummaries(activeTickers);
      setWatchlistItems(summaries);
    } catch {}
  }, [activeTickers]);

  // Initial load
  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Countdown timer effect
  useEffect(() => {
    if (!isAutoRefreshActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadMarketData();
          loadWatchlist();
          return COUNTDOWN_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshActive, loadMarketData, loadWatchlist]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    setCountdown(COUNTDOWN_INTERVAL);
    loadMarketData();
    loadWatchlist();
  };

  // Switch ticker
  const handleSelectTicker = (symbol: string) => {
    const found =
      activeTickers.find((t) => t.symbol === symbol) ||
      DEFAULT_TICKERS.find((t) => t.symbol === symbol);

    if (found) {
      setCurrentTicker(found);
      setCountdown(COUNTDOWN_INTERVAL);
    }
  };

  // Add ticker to watchlist
  const handleAddTicker = (ticker: TickerInfo) => {
    if (!activeTickers.some((t) => t.symbol === ticker.symbol)) {
      setActiveTickers((prev) => [...prev, ticker]);
    }
  };

  // Remove ticker from watchlist
  const handleRemoveTicker = (symbol: string) => {
    if (activeTickers.length <= 1) return;
    const filtered = activeTickers.filter((t) => t.symbol !== symbol);
    setActiveTickers(filtered);
    if (currentTicker.symbol === symbol && filtered.length > 0) {
      setCurrentTicker(filtered[0]);
    }
  };

  // Latest price & 24h change for current ticker
  const currentSummary = watchlistItems.find((i) => i.symbol === currentTicker.symbol);
  const latestPrice =
    currentSummary?.price ||
    (candles.length > 0 ? candles[candles.length - 1].close : currentTicker.basePrice || 100);
  const change24h = currentSummary?.change24h || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTicker={currentTicker}
        latestPrice={latestPrice}
        change24h={change24h}
        connectionStatus={connectionStatus}
        refreshCountdown={countdown}
        maxCountdown={COUNTDOWN_INTERVAL}
        isAutoRefreshActive={isAutoRefreshActive}
        onToggleAutoRefresh={() => setIsAutoRefreshActive(!isAutoRefreshActive)}
        onManualRefresh={handleManualRefresh}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenIndicatorsModal={() => setIsIndicatorsOpen(true)}
        onOpenDocsModal={() => setIsDocsOpen(true)}
        activeViewTab={activeViewTab}
        onChangeViewTab={setActiveViewTab}
      />

      {/* Ticker Ribbon */}
      <TickerTape
        items={watchlistItems}
        currentTicker={currentTicker}
        onSelectTicker={handleSelectTicker}
      />

      {/* Main Body */}
      <main className="flex-1 p-3 lg:p-4 max-w-[1920px] w-full mx-auto flex flex-col gap-3">
        {activeViewTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Left 3 Cols: Candlestick Chart & Indicator Sub-Panels */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              {/* Candlestick Chart */}
              <CandlestickChart
                candles={candles}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                indicators={indicators}
                theme={theme}
                symbol={currentTicker.symbol}
              />

              {/* Technical Indicator Sub-Panels */}
              {indicators.rsi.enabled && (
                <RSIPanel
                  candles={candles}
                  config={indicators.rsi}
                  theme={theme}
                />
              )}

              {indicators.macd.enabled && (
                <MACDPanel
                  candles={candles}
                  config={indicators.macd}
                  theme={theme}
                />
              )}

              {/* Terminal Stats */}
              <TerminalStats ticker={currentTicker} candles={candles} />
            </div>

            {/* Right 1 Col: Watchlist Sidebar */}
            <div className="lg:col-span-1">
              <Watchlist
                items={watchlistItems}
                currentTicker={currentTicker}
                onSelectTicker={handleSelectTicker}
                onAddTicker={handleAddTicker}
                onRemoveTicker={handleRemoveTicker}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Volatility Heatmap */}
        {activeViewTab === 'heatmap' && (
          <VolatilityHeatmap
            items={watchlistItems}
            onSelectTicker={(sym) => {
              handleSelectTicker(sym);
              setActiveViewTab('dashboard');
            }}
          />
        )}

        {/* Tab 3: Correlation Matrix */}
        {activeViewTab === 'correlation' && (
          <CorrelationMatrix
            items={watchlistItems}
            onSelectTicker={(sym) => {
              handleSelectTicker(sym);
              setActiveViewTab('dashboard');
            }}
          />
        )}
      </main>

      {/* Technical Modals */}
      <IndicatorsModal
        isOpen={isIndicatorsOpen}
        onClose={() => setIsIndicatorsOpen(false)}
        indicators={indicators}
        onChangeIndicators={setIndicators}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
};

export default App;

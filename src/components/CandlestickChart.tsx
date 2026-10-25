import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  LineStyle,
  UTCTimestamp,
} from 'lightweight-charts';
import {
  Candle,
  Timeframe,
  IndicatorConfig,
  SeriesPoint,
  BollingerBandsResult,
} from '../types/market';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
} from '../utils/indicators';
import { TIMEFRAMES } from '../services/marketData';
import { formatCurrency, formatVolume, formatTime } from '../utils/formatters';
import { Maximize2, Minimize2 } from 'lucide-react';

interface CandlestickChartProps {
  candles: Candle[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  indicators: IndicatorConfig;
  theme: 'dark' | 'light';
  symbol: string;
}

interface HoveredCandleInfo {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePct: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  timeframe,
  onTimeframeChange,
  indicators,
  theme,
  symbol,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Series references
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [hoveredData, setHoveredData] = useState<HoveredCandleInfo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isDark = theme === 'dark';

  // Build or update the chart
  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDark ? '#0b0e14' : '#ffffff',
        },
        textColor: isDark ? '#94a3b8' : '#475569',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
        horzLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#1e293b' : '#e2e8f0',
        },
        horzLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#1e293b' : '#e2e8f0',
        },
      },
      timeScale: {
        borderColor: isDark ? '#1e293b' : '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDark ? '#1e293b' : '#cbd5e1',
        autoScale: true,
      },
    });

    // 1. Candlestick Series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Series (sub-layer)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay on same chart
    });
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. SMA Lines
    sma20SeriesRef.current = chart.addLineSeries({
      color: '#06b6d4', // Cyan
      lineWidth: 2,
      priceLineVisible: false,
    });
    sma50SeriesRef.current = chart.addLineSeries({
      color: '#f59e0b', // Amber
      lineWidth: 2,
      priceLineVisible: false,
    });
    sma200SeriesRef.current = chart.addLineSeries({
      color: '#a855f7', // Purple
      lineWidth: 2,
      priceLineVisible: false,
    });

    // 4. EMA Lines
    ema20SeriesRef.current = chart.addLineSeries({
      color: '#6366f1', // Indigo
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
    });
    ema50SeriesRef.current = chart.addLineSeries({
      color: '#14b8a6', // Teal
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
    });
    ema200SeriesRef.current = chart.addLineSeries({
      color: '#ec4899', // Pink
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
    });

    // 5. Bollinger Bands
    bbUpperSeriesRef.current = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });
    bbMiddleSeriesRef.current = chart.addLineSeries({
      color: '#0284c7',
      lineWidth: 1,
      priceLineVisible: false,
    });
    bbLowerSeriesRef.current = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });

    // Crosshair hover handler
    chart.subscribeCrosshairMove((param) => {
      if (
        param.time &&
        param.seriesData &&
        candleSeriesRef.current &&
        param.seriesData.get(candleSeriesRef.current)
      ) {
        const cData = param.seriesData.get(candleSeriesRef.current) as any;
        if (cData && typeof cData.open === 'number') {
          const changePct = ((cData.close - cData.open) / cData.open) * 100;
          // Find matching volume
          const matchingCandle = candles.find((c) => c.time === param.time);
          setHoveredData({
            time: Number(param.time),
            open: cData.open,
            high: cData.high,
            low: cData.low,
            close: cData.close,
            volume: matchingCandle ? matchingCandle.volume : 0,
            changePct,
          });
        }
      } else {
        setHoveredData(null);
      }
    });

    chartRef.current = chart;
  }, [isDark, candles]);

  // Initialize on mount or theme change
  useEffect(() => {
    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Update series data whenever candles or indicators change
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || candles.length === 0) return;

    // 1. Candlestick data
    const formattedCandles = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(formattedCandles);

    // 2. Volume data
    if (volumeSeriesRef.current) {
      if (indicators.volume.enabled) {
        const volumeData = candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
        }));
        volumeSeriesRef.current.setData(volumeData);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    // 3. SMA series
    const updateSMA = (
      seriesRef: React.MutableRefObject<ISeriesApi<'Line'> | null>,
      period: number,
      visible: boolean
    ) => {
      if (!seriesRef.current) return;
      if (visible && indicators.sma.enabled) {
        const smaPoints: SeriesPoint[] = calculateSMA(candles, period);
        seriesRef.current.setData(
          smaPoints.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
      } else {
        seriesRef.current.setData([]);
      }
    };

    updateSMA(sma20SeriesRef, 20, indicators.sma.show20);
    updateSMA(sma50SeriesRef, 50, indicators.sma.show50);
    updateSMA(sma200SeriesRef, 200, indicators.sma.show200);

    // 4. EMA series
    const updateEMA = (
      seriesRef: React.MutableRefObject<ISeriesApi<'Line'> | null>,
      period: number,
      visible: boolean
    ) => {
      if (!seriesRef.current) return;
      if (visible && indicators.ema.enabled) {
        const emaPoints: SeriesPoint[] = calculateEMA(candles, period);
        seriesRef.current.setData(
          emaPoints.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
      } else {
        seriesRef.current.setData([]);
      }
    };

    updateEMA(ema20SeriesRef, 20, indicators.ema.show20);
    updateEMA(ema50SeriesRef, 50, indicators.ema.show50);
    updateEMA(ema200SeriesRef, 200, indicators.ema.show200);

    // 5. Bollinger Bands series
    if (bbUpperSeriesRef.current && bbMiddleSeriesRef.current && bbLowerSeriesRef.current) {
      if (indicators.bollinger.enabled) {
        const bb: BollingerBandsResult = calculateBollingerBands(
          candles,
          indicators.bollinger.period,
          indicators.bollinger.multiplier
        );
        bbUpperSeriesRef.current.setData(
          bb.upper.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
        bbMiddleSeriesRef.current.setData(
          bb.middle.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
        bbLowerSeriesRef.current.setData(
          bb.lower.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
      } else {
        bbUpperSeriesRef.current.setData([]);
        bbMiddleSeriesRef.current.setData([]);
        bbLowerSeriesRef.current.setData([]);
      }
    }

    // Auto-fit content on initial load
    chartRef.current.timeScale().fitContent();
  }, [candles, indicators]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const latestCandle = candles[candles.length - 1];
  const activeCandle = hoveredData || (latestCandle ? {
    time: latestCandle.time,
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    close: latestCandle.close,
    volume: latestCandle.volume,
    changePct: ((latestCandle.close - latestCandle.open) / latestCandle.open) * 100,
  } : null);

  return (
    <div className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
    }`}>
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-950/90 border-b border-slate-800 gap-2">
        {/* Left: Timeframe Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all ${
                timeframe === tf.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Middle: Overlay Legend Chips */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
          {indicators.sma.enabled && (
            <>
              {indicators.sma.show20 && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-0.5 bg-cyan-400" /> SMA 20
                </span>
              )}
              {indicators.sma.show50 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-0.5 bg-amber-400" /> SMA 50
                </span>
              )}
              {indicators.sma.show200 && (
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2 h-0.5 bg-purple-400" /> SMA 200
                </span>
              )}
            </>
          )}

          {indicators.ema.enabled && (
            <>
              {indicators.ema.show20 && (
                <span className="flex items-center gap-1 text-indigo-400">
                  <span className="w-2 h-0.5 bg-indigo-400 border-b border-dotted" /> EMA 20
                </span>
              )}
              {indicators.ema.show50 && (
                <span className="flex items-center gap-1 text-teal-400">
                  <span className="w-2 h-0.5 bg-teal-400 border-b border-dotted" /> EMA 50
                </span>
              )}
              {indicators.ema.show200 && (
                <span className="flex items-center gap-1 text-pink-400">
                  <span className="w-2 h-0.5 bg-pink-400 border-b border-dotted" /> EMA 200
                </span>
              )}
            </>
          )}

          {indicators.bollinger.enabled && (
            <span className="flex items-center gap-1 text-sky-400">
              <span className="w-2 h-0.5 bg-sky-400" /> BB ({indicators.bollinger.period}, {indicators.bollinger.multiplier})
            </span>
          )}

          {indicators.volume.enabled && (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-1 bg-emerald-500/60" /> Vol
            </span>
          )}
        </div>

        {/* Right: Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Real-time HUD Bar */}
      {activeCandle && (
        <div className="absolute top-12 left-3 z-20 flex flex-wrap items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono shadow-lg">
          <span className="text-slate-400 font-semibold">{symbol}</span>
          <span className="text-slate-500">{formatTime(activeCandle.time)}</span>

          <div className="flex items-center gap-2">
            <span>O: <span className="text-slate-200">{formatCurrency(activeCandle.open)}</span></span>
            <span>H: <span className="text-slate-200">{formatCurrency(activeCandle.high)}</span></span>
            <span>L: <span className="text-slate-200">{formatCurrency(activeCandle.low)}</span></span>
            <span>C: <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
              {formatCurrency(activeCandle.close)}
            </span></span>
          </div>

          <span className={activeCandle.changePct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {activeCandle.changePct >= 0 ? '+' : ''}{activeCandle.changePct.toFixed(2)}%
          </span>

          <span className="text-slate-400 border-l border-slate-800 pl-2">
            Vol: <span className="text-slate-200">{formatVolume(activeCandle.volume)}</span>
          </span>
        </div>
      )}

      {/* Chart Canvas Container */}
      <div
        ref={chartContainerRef}
        className={`w-full ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[430px]'}`}
      />
    </div>
  );
};

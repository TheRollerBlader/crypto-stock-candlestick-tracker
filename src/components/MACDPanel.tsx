import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  UTCTimestamp,
} from 'lightweight-charts';
import { Candle, IndicatorConfig, MACDResult } from '../types/market';
import { calculateMACD } from '../utils/indicators';

interface MACDPanelProps {
  candles: Candle[];
  config: IndicatorConfig['macd'];
  theme: 'dark' | 'light';
}

export const MACDPanel: React.FC<MACDPanelProps> = ({ candles, config, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const histSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const isDark = theme === 'dark';

  const macdData: MACDResult = calculateMACD(
    candles,
    config.fast,
    config.slow,
    config.signal
  );

  const latestMACD = macdData.macd.length > 0 ? macdData.macd[macdData.macd.length - 1].value : null;
  const latestSignal = macdData.signal.length > 0 ? macdData.signal[macdData.signal.length - 1].value : null;
  const latestHist = macdData.histogram.length > 0 ? macdData.histogram[macdData.histogram.length - 1].value : null;

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 130,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#0b0e14' : '#ffffff' },
        textColor: isDark ? '#94a3b8' : '#475569',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
        horzLines: { color: isDark ? '#1e293b' : '#f1f5f9' },
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

    // Histogram Series
    const histSeries = chart.addHistogramSeries({
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
      priceLineVisible: false,
    });

    // MACD Line
    const macdSeries = chart.addLineSeries({
      color: '#38bdf8', // Sky Blue
      lineWidth: 2,
      priceLineVisible: false,
    });

    // Signal Line
    const signalSeries = chart.addLineSeries({
      color: '#f59e0b', // Amber
      lineWidth: 1,
      priceLineVisible: false,
    });

    histSeriesRef.current = histSeries;
    macdSeriesRef.current = macdSeries;
    signalSeriesRef.current = signalSeries;
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isDark]);

  useEffect(() => {
    if (!chartRef.current || macdData.macd.length === 0) return;

    if (macdSeriesRef.current) {
      macdSeriesRef.current.setData(
        macdData.macd.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
      );
    }

    if (signalSeriesRef.current) {
      signalSeriesRef.current.setData(
        macdData.signal.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
      );
    }

    if (histSeriesRef.current) {
      histSeriesRef.current.setData(
        macdData.histogram.map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
          color: p.color,
        }))
      );
    }

    chartRef.current.timeScale().fitContent();
  }, [macdData]);

  const isBullish = latestHist !== null && latestHist >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sky-400">
            MACD ({config.fast}, {config.slow}, {config.signal})
          </span>

          {latestMACD !== null && (
            <span className="text-sky-400 font-medium">
              MACD: <span className="font-mono-numbers">{latestMACD.toFixed(3)}</span>
            </span>
          )}

          {latestSignal !== null && (
            <span className="text-amber-400 font-medium">
              Sig: <span className="font-mono-numbers">{latestSignal.toFixed(3)}</span>
            </span>
          )}

          {latestHist !== null && (
            <span className={latestHist >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              Hist: <span className="font-mono-numbers">{latestHist.toFixed(3)}</span>
            </span>
          )}
        </div>

        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
          isBullish
            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
            : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
        }`}>
          {isBullish ? 'Bullish Divergence' : 'Bearish Divergence'}
        </span>
      </div>
      <div ref={containerRef} className="w-full h-[130px]" />
    </div>
  );
};

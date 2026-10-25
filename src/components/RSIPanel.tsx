import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  LineStyle,
  UTCTimestamp,
} from 'lightweight-charts';
import { Candle, IndicatorConfig, SeriesPoint } from '../types/market';
import { calculateRSI } from '../utils/indicators';

interface RSIPanelProps {
  candles: Candle[];
  config: IndicatorConfig['rsi'];
  theme: 'dark' | 'light';
}

export const RSIPanel: React.FC<RSIPanelProps> = ({ candles, config, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const isDark = theme === 'dark';

  const rsiData: SeriesPoint[] = calculateRSI(candles, config.period);
  const latestRSI = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : null;

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 120,
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
        timeVisible: false,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDark ? '#1e293b' : '#cbd5e1',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    const lineSeries = chart.addLineSeries({
      color: '#a855f7', // Purple
      lineWidth: 2,
      priceLineVisible: false,
    });

    // Reference lines for 70, 50, 30
    lineSeries.createPriceLine({
      price: config.overbought,
      color: '#f43f5e',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OB 70',
    });

    lineSeries.createPriceLine({
      price: 50,
      color: '#64748b',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: '50',
    });

    lineSeries.createPriceLine({
      price: config.oversold,
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'OS 30',
    });

    lineSeriesRef.current = lineSeries;
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
  }, [isDark, config.overbought, config.oversold]);

  useEffect(() => {
    if (!lineSeriesRef.current || !chartRef.current || rsiData.length === 0) return;

    lineSeriesRef.current.setData(
      rsiData.map((d) => ({
        time: d.time as UTCTimestamp,
        value: d.value,
      }))
    );
    chartRef.current.timeScale().fitContent();
  }, [rsiData]);

  let statusText = 'Neutral';
  let statusColor = 'text-slate-400 border-slate-700 bg-slate-800/40';
  if (latestRSI !== null) {
    if (latestRSI >= config.overbought) {
      statusText = 'Overbought (>70)';
      statusColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    } else if (latestRSI <= config.oversold) {
      statusText = 'Oversold (<30)';
      statusColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-purple-400">RSI ({config.period})</span>
          {latestRSI !== null && (
            <span className="text-slate-200 font-semibold font-mono-numbers">
              {latestRSI.toFixed(2)}
            </span>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${statusColor}`}>
          {statusText}
        </span>
      </div>
      <div ref={containerRef} className="w-full h-[120px]" />
    </div>
  );
};

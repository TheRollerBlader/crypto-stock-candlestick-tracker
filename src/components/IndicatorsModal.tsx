import React from 'react';
import { IndicatorConfig } from '../types/market';
import { X, Check } from 'lucide-react';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig;
  onChangeIndicators: (updated: IndicatorConfig) => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onChangeIndicators,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
              Technical Indicator Overlays
            </h3>
            <p className="text-xs text-slate-400">Configure quantitative chart overlays and sub-panels</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form body */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh] text-xs font-mono">
          {/* Simple Moving Averages */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Simple Moving Average (SMA)</span>
              <input
                type="checkbox"
                checked={indicators.sma.enabled}
                onChange={(e) =>
                  onChangeIndicators({
                    ...indicators,
                    sma: { ...indicators.sma, enabled: e.target.checked },
                  })
                }
                className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.sma.show20}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      sma: { ...indicators.sma, show20: e.target.checked },
                    })
                  }
                  className="accent-cyan-400"
                />
                <span className="text-cyan-400 font-semibold">SMA 20</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.sma.show50}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      sma: { ...indicators.sma, show50: e.target.checked },
                    })
                  }
                  className="accent-amber-400"
                />
                <span className="text-amber-400 font-semibold">SMA 50</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.sma.show200}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      sma: { ...indicators.sma, show200: e.target.checked },
                    })
                  }
                  className="accent-purple-400"
                />
                <span className="text-purple-400 font-semibold">SMA 200</span>
              </label>
            </div>
          </div>

          {/* Exponential Moving Averages */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Exponential Moving Average (EMA)</span>
              <input
                type="checkbox"
                checked={indicators.ema.enabled}
                onChange={(e) =>
                  onChangeIndicators({
                    ...indicators,
                    ema: { ...indicators.ema, enabled: e.target.checked },
                  })
                }
                className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.ema.show20}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      ema: { ...indicators.ema, show20: e.target.checked },
                    })
                  }
                  className="accent-indigo-400"
                />
                <span className="text-indigo-400 font-semibold">EMA 20</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.ema.show50}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      ema: { ...indicators.ema, show50: e.target.checked },
                    })
                  }
                  className="accent-teal-400"
                />
                <span className="text-teal-400 font-semibold">EMA 50</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={indicators.ema.show200}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      ema: { ...indicators.ema, show200: e.target.checked },
                    })
                  }
                  className="accent-pink-400"
                />
                <span className="text-pink-400 font-semibold">EMA 200</span>
              </label>
            </div>
          </div>

          {/* Bollinger Bands */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Bollinger Bands (BB)</span>
              <input
                type="checkbox"
                checked={indicators.bollinger.enabled}
                onChange={(e) =>
                  onChangeIndicators({
                    ...indicators,
                    bollinger: { ...indicators.bollinger, enabled: e.target.checked },
                  })
                }
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-400">
              <div className="flex items-center gap-2">
                <span>Period:</span>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={indicators.bollinger.period}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      bollinger: {
                        ...indicators.bollinger,
                        period: parseInt(e.target.value) || 20,
                      },
                    })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Multiplier:</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={indicators.bollinger.multiplier}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      bollinger: {
                        ...indicators.bollinger,
                        multiplier: parseFloat(e.target.value) || 2,
                      },
                    })
                  }
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Relative Strength Index (RSI) */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Relative Strength Index (RSI)</span>
              <input
                type="checkbox"
                checked={indicators.rsi.enabled}
                onChange={(e) =>
                  onChangeIndicators({
                    ...indicators,
                    rsi: { ...indicators.rsi, enabled: e.target.checked },
                  })
                }
                className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-400">
              <div>
                <span>Period:</span>
                <input
                  type="number"
                  value={indicators.rsi.period}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      rsi: { ...indicators.rsi, period: parseInt(e.target.value) || 14 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-slate-200"
                />
              </div>
              <div>
                <span>Overbought:</span>
                <input
                  type="number"
                  value={indicators.rsi.overbought}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      rsi: { ...indicators.rsi, overbought: parseInt(e.target.value) || 70 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-slate-200"
                />
              </div>
              <div>
                <span>Oversold:</span>
                <input
                  type="number"
                  value={indicators.rsi.oversold}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      rsi: { ...indicators.rsi, oversold: parseInt(e.target.value) || 30 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* MACD */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">MACD (12, 26, 9)</span>
              <input
                type="checkbox"
                checked={indicators.macd.enabled}
                onChange={(e) =>
                  onChangeIndicators({
                    ...indicators,
                    macd: { ...indicators.macd, enabled: e.target.checked },
                  })
                }
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-400">
              <div>
                <span>Fast EMA:</span>
                <input
                  type="number"
                  value={indicators.macd.fast}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      macd: { ...indicators.macd, fast: parseInt(e.target.value) || 12 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-slate-200"
                />
              </div>
              <div>
                <span>Slow EMA:</span>
                <input
                  type="number"
                  value={indicators.macd.slow}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      macd: { ...indicators.macd, slow: parseInt(e.target.value) || 26 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-slate-200"
                />
              </div>
              <div>
                <span>Signal:</span>
                <input
                  type="number"
                  value={indicators.macd.signal}
                  onChange={(e) =>
                    onChangeIndicators({
                      ...indicators,
                      macd: { ...indicators.macd, signal: parseInt(e.target.value) || 9 },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Volume Overlay */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200">Volume Sub-Layer</span>
              <p className="text-[10px] text-slate-500">Color-coded transaction volume bars on main canvas</p>
            </div>
            <input
              type="checkbox"
              checked={indicators.volume.enabled}
              onChange={(e) =>
                onChangeIndicators({
                  ...indicators,
                  volume: { enabled: e.target.checked },
                })
              }
              className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, BookOpen, Sigma, Activity, Cpu } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                Quantitative Specification & Mathematical Formulations
              </h3>
              <p className="text-xs text-slate-400">Exact formulas implemented in ApexTerminal's analytics engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Section 1: RSI */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
              <Sigma className="w-4 h-4" />
              1. Relative Strength Index (RSI - Wilder's Smoothing)
            </div>
            <p>
              Given a sequence of close prices P(t), the price change is ΔP(t) = P(t) - P(t-1). Upward moves are U(t) = max(ΔP(t), 0) and downward moves are D(t) = max(-ΔP(t), 0).
            </p>
            <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-slate-200 border border-slate-800 space-y-1">
              <div>{'Initial seed: AvgGain_N = (1/N) * Σ U_i,   AvgLoss_N = (1/N) * Σ D_i'}</div>
              <div>{"Wilder's recurrence: AvgGain_t = (AvgGain_{t-1} * (N-1) + U_t) / N"}</div>
              <div>{"AvgLoss_t = (AvgLoss_{t-1} * (N-1) + D_t) / N"}</div>
              <div>{'RS_t = AvgGain_t / AvgLoss_t'}</div>
              <div className="text-emerald-400 font-bold">{'RSI_t = 100 - (100 / (1 + RS_t))'}</div>
            </div>
            <p className="text-slate-400 text-[11px]">
              Overbought threshold: ≥ 70; Oversold threshold: ≤ 30. Default window N = 14.
            </p>
          </div>

          {/* Section 2: MACD */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-sm">
              <Activity className="w-4 h-4" />
              2. Moving Average Convergence Divergence (MACD)
            </div>
            <p>
              Calculated using standard Exponential Moving Averages (EMA) with smoothing multiplier α = 2 / (N + 1):
            </p>
            <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-slate-200 border border-slate-800 space-y-1">
              <div>{'MACD Line_t = EMA_12(P_t) - EMA_26(P_t)'}</div>
              <div>{'Signal Line_t = EMA_9(MACD Line_t)'}</div>
              <div className="text-cyan-400 font-bold">{'Histogram_t = MACD Line_t - Signal Line_t'}</div>
            </div>
          </div>

          {/* Section 3: Bollinger Bands */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
              <Sigma className="w-4 h-4" />
              3. Bollinger Bands (20, 2)
            </div>
            <p>
              Measures dynamic market volatility relative to an N-period simple moving average:
            </p>
            <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-slate-200 border border-slate-800 space-y-1">
              <div>{'Middle Band_t = SMA_N(P_t) = (1/N) * Σ P_{t-i}'}</div>
              <div>{'σ_t = sqrt( (1/N) * Σ (P_{t-i} - SMA_N(P_t))^2 )'}</div>
              <div className="text-amber-400 font-bold">{'Upper Band_t = SMA_N(P_t) + k * σ_t'}</div>
              <div className="text-amber-400 font-bold">{'Lower Band_t = SMA_N(P_t) - k * σ_t'}</div>
            </div>
            <p className="text-slate-400 text-[11px]">
              Parameters: Period N = 20, standard deviation multiplier k = 2.0.
            </p>
          </div>

          {/* Section 4: Pearson Correlation Matrix */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
              <Cpu className="w-4 h-4" />
              4. Pearson Product-Moment Correlation Matrix
            </div>
            <p>
              Given synchronized log or periodic return vectors X and Y of length M:
            </p>
            <div className="bg-slate-900 p-3 rounded font-mono text-[11px] text-slate-200 border border-slate-800 space-y-1">
              <div>{'r_{XY} = Σ ((X_t - μX)(Y_t - μY)) / (sqrt(Σ (X_t - μX)^2) * sqrt(Σ (Y_t - μY)^2))'}</div>
              <div>{'Annualized Volatility: σ_ann = σ_daily * sqrt(252 or 365) * 100%'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

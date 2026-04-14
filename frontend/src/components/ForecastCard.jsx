import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(v);

const formatCompact = (v) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

const formatMonth = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 shadow-lg border text-sm"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      <p className="font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {item.label}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span style={{ color: 'var(--text-secondary)' }}>Predicted</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(item.predicted)}
          </span>
        </div>
        {item.upper !== item.predicted && (
          <div className="flex justify-between gap-6">
            <span style={{ color: 'var(--text-secondary)' }}>Range</span>
            <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {formatCompact(item.originalLower)} – {formatCompact(item.upper)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForecastCard({ data }) {
  const [tableOpen, setTableOpen] = useState(false);

  const {
    symbol,
    current_price,
    trend,
    projected_change_pct,
    training_info,
    monthly_predictions,
  } = data;

  const isUp = trend === 'upward';
  const accent = isUp ? '#10b981' : '#ef4444';

  const pctOf = (price) =>
    current_price > 0
      ? (((price - current_price) / current_price) * 100).toFixed(1)
      : '0';

  const chartData = useMemo(() => [
    {
      label: 'Today',
      predicted: current_price,
      lower: current_price,
      band: 0,
      upper: current_price,
      originalLower: current_price,
    },
    ...monthly_predictions.map((p) => {
      const clampedLower = Math.max(0, p.lower_bound);
      return {
        label: formatMonth(p.date),
        predicted: Math.max(0, p.predicted_price),
        lower: clampedLower,
        band: Math.max(0, p.upper_bound) - clampedLower,
        upper: Math.max(0, p.upper_bound),
        originalLower: clampedLower,
      };
    }),
  ], [current_price, monthly_predictions]);

  const milestones = useMemo(() => {
    const p = monthly_predictions;
    const pick = (idx) => p[Math.min(idx, p.length - 1)];
    return [
      { label: '3-Month', data: pick(2) },
      { label: '6-Month', data: pick(5) },
      { label: p.length > 12 ? 'End Target' : '12-Month', data: p[p.length - 1] },
    ];
  }, [monthly_predictions]);

  const yMin = Math.max(0, Math.min(...chartData.map((d) => d.originalLower)) * 0.95);
  const yMax = Math.max(...chartData.map((d) => d.upper)) * 1.05;

  const gradientId = `forecast-band-${symbol}`;

  return (
    <div
      className="forecast-card rounded-2xl overflow-hidden my-4 border"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {symbol}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: isUp ? '#10b98118' : '#ef444418', color: accent }}
              >
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{projected_change_pct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(current_price)}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                current price
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] leading-relaxed shrink-0" style={{ color: 'var(--text-secondary)' }}>
            <div className="font-medium">Prophet ML Model</div>
            <div>{training_info?.training_data_points?.toLocaleString()} data points</div>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="px-2 pb-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.2} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${Math.round(v)}`}
              width={55}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={current_price}
              stroke="var(--text-secondary)"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            {/* Confidence band: stacked lower (transparent) + band (filled) */}
            <Area
              type="monotone"
              dataKey="lower"
              stackId="confidence"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="band"
              stackId="confidence"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
            {/* Prediction line */}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke={accent}
              strokeWidth={2.5}
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: accent, stroke: 'var(--card-bg)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Milestone Cards ── */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2.5">
        {milestones.map(({ label, data: pred }) => {
          const change = parseFloat(pctOf(pred.predicted_price));
          const pos = change >= 0;
          return (
            <div
              key={label}
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div
                className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
              </div>
              <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(pred.predicted_price)}
              </div>
              <div
                className="text-xs font-semibold tabular-nums mt-0.5"
                style={{ color: pos ? '#10b981' : '#ef4444' }}
              >
                {pos ? '+' : ''}{change}%
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Monthly Breakdown ── */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => setTableOpen((o) => !o)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>Monthly Breakdown ({monthly_predictions.length} months)</span>
          {tableOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {tableOpen && (
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th className="text-left px-3 py-2.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Month
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Predicted
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    Range
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthly_predictions.map((p, i) => {
                  const change = parseFloat(pctOf(p.predicted_price));
                  const pos = change >= 0;
                  return (
                    <tr
                      key={p.date}
                      className="forecast-table-row"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--border-color)' : undefined,
                      }}
                    >
                      <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                        {formatMonth(p.date)}
                      </td>
                      <td
                        className="text-right px-3 py-2 font-semibold tabular-nums"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatCurrency(p.predicted_price)}
                      </td>
                      <td
                        className="text-right px-3 py-2 tabular-nums hidden sm:table-cell"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatCompact(p.lower_bound)} – {formatCompact(p.upper_bound)}
                      </td>
                      <td
                        className="text-right px-3 py-2 font-semibold tabular-nums"
                        style={{ color: pos ? '#10b981' : '#ef4444' }}
                      >
                        {pos ? '+' : ''}{change}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Disclaimer Footer ── */}
      <div
        className="px-5 py-3 text-[11px] leading-relaxed"
        style={{
          background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        Based on historical patterns using Meta's Prophet model.
        The shaded area shows the range of likely prices — a wider range means less certainty.
        This is a statistical projection, not financial advice.
      </div>
    </div>
  );
}

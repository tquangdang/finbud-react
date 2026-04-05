import { useState, useEffect, useRef, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../services/api';

function formatPrice(n) {
  if (n == null) return '—';
  return `$${Number(n).toFixed(2)}`;
}

function formatChange(change, pct) {
  if (change == null) return null;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

export default function StockPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartRange, setChartRange] = useState('1M');
  const [chartLoading, setChartLoading] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const searchSymbols = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/stocks/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(() => searchSymbols(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchSymbols]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchChart = useCallback(async (symbol, range) => {
    setChartLoading(true);
    try {
      const res = await api.get(`/stocks/chart/${symbol}?range=${range}`);
      setChartData(res.data);
    } catch {
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const selectSymbol = async (symbol) => {
    setShowResults(false);
    setQuery(symbol);
    setLoading(true);
    setError('');
    setQuote(null);
    setProfile(null);
    setChartData([]);
    setActiveSymbol(symbol);
    setChartRange('1M');

    try {
      const [quoteRes, profileRes] = await Promise.all([
        api.get(`/stocks/quote/${symbol}`),
        api.get(`/stocks/profile/${symbol}`).catch(() => ({ data: null })),
      ]);
      setQuote(quoteRes.data);
      setProfile(profileRes.data);
      fetchChart(symbol, '1M');
    } catch {
      setError('Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (range) => {
    setChartRange(range);
    if (activeSymbol) fetchChart(activeSymbol, range);
  };

  const isPositive = quote?.change >= 0;

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Stock Analysis
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Search for any stock to view live market data
          </p>
        </div>

        {/* Search */}
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name or symbol (e.g. AAPL, Tesla)"
            className="w-full px-5 py-3 rounded-xl outline-none transition"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              if (results.length > 0) setShowResults(true);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}
              />
            </div>
          )}

          {showResults && results.length > 0 && (
            <ul
              className="absolute z-10 left-0 right-0 mt-2 rounded-xl overflow-hidden shadow-lg max-h-72 overflow-y-auto"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              {results.map((r) => (
                <li key={r.symbol}>
                  <button
                    type="button"
                    onClick={() => selectSymbol(r.symbol)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between transition"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <span className="font-semibold text-sm">{r.symbol}</span>
                      <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {r.description}
                      </span>
                    </div>
                    <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                      {r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="text-sm rounded-xl px-4 py-3" style={{ background: 'var(--hover-bg)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}
            />
          </div>
        )}

        {/* Stock card */}
        {!loading && quote && (
          <div className="space-y-4">
            {/* Company header */}
            <div
              className="rounded-2xl p-6 shadow-sm"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-4">
                {profile?.logo && (
                  <img
                    src={profile.logo}
                    alt={profile.name}
                    className="w-14 h-14 rounded-xl object-contain"
                    style={{ background: 'var(--bg-secondary)', padding: '6px' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {profile?.name || quote.symbol}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {quote.symbol}
                    </span>
                    {profile?.exchange && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
                      >
                        {profile.exchange}
                      </span>
                    )}
                    {profile?.finnhubIndustry && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
                      >
                        {profile.finnhubIndustry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mt-6">
                <p className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {formatPrice(quote.currentPrice)}
                </p>
                {quote.change != null && (
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={{ color: isPositive ? '#22c55e' : '#ef4444' }}
                  >
                    {formatChange(quote.change, quote.changePercent)}
                  </p>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Open', value: formatPrice(quote.open) },
                { label: 'High', value: formatPrice(quote.high) },
                { label: 'Low', value: formatPrice(quote.low) },
                { label: 'Prev Close', value: formatPrice(quote.previousClose) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {s.label}
                  </p>
                  <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div
              className="rounded-2xl p-6 shadow-sm"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Price History
                </h3>
                <div className="flex gap-1">
                  {['1W', '1M', '3M', '1Y'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRangeChange(r)}
                      className="px-3 py-1 text-xs font-medium rounded-lg transition"
                      style={{
                        background: chartRange === r ? 'var(--accent-color)' : 'transparent',
                        color: chartRange === r ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (chartRange !== r) e.currentTarget.style.background = 'var(--hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        if (chartRange !== r) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {chartLoading ? (
                <div className="flex justify-center py-12">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}
                  />
                </div>
              ) : chartData.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No chart data available for this range.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(ts) => {
                        const d = new Date(ts);
                        return chartRange === '1W'
                          ? d.toLocaleDateString('en-US', { weekday: 'short' })
                          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                      }}
                      labelFormatter={(ts) =>
                        new Date(ts).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      }
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Close']}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Company details */}
            {profile?.weburl && (
              <div
                className="rounded-2xl p-6 shadow-sm"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  About {profile.name}
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  {profile.country && (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>Country</span>
                      <span style={{ color: 'var(--text-primary)' }}>{profile.country}</span>
                    </>
                  )}
                  {profile.marketCapitalization && (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>Market Cap</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        ${(profile.marketCapitalization).toLocaleString()}M
                      </span>
                    </>
                  )}
                  {profile.ipo && (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>IPO Date</span>
                      <span style={{ color: 'var(--text-primary)' }}>{profile.ipo}</span>
                    </>
                  )}
                  {profile.weburl && (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>Website</span>
                      <a
                        href={profile.weburl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                        style={{ color: 'var(--accent-color)' }}
                      >
                        {profile.weburl.replace(/^https?:\/\//, '')}
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !quote && !error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📈</div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Search for a stock
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Type a company name or ticker symbol above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

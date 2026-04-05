import axios from 'axios';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const apiKey = () => process.env.FINNHUB_API_KEY;

export const getQuote = async (symbol) => {
  const res = await axios.get(`${FINNHUB_BASE}/quote`, {
    params: { symbol: symbol.toUpperCase(), token: apiKey() },
  });
  return {
    symbol: symbol.toUpperCase(),
    currentPrice: res.data.c,
    change: res.data.d,
    changePercent: res.data.dp,
    high: res.data.h,
    low: res.data.l,
    open: res.data.o,
    previousClose: res.data.pc,
  };
};

export const searchSymbol = async (query) => {
  const res = await axios.get(`${FINNHUB_BASE}/search`, {
    params: { q: query, token: apiKey() },
  });
  return res.data.result?.slice(0, 8) || [];
};

export const getCompanyProfile = async (symbol) => {
  const res = await axios.get(`${FINNHUB_BASE}/stock/profile2`, {
    params: { symbol: symbol.toUpperCase(), token: apiKey() },
  });
  return res.data;
};

export const getCandles = async (symbol, from, to, resolution = 'D') => {
  const res = await axios.get(`${FINNHUB_BASE}/stock/candle`, {
    params: {
      symbol: symbol.toUpperCase(),
      resolution,
      from,
      to,
      token: apiKey(),
    },
  });
  if (res.data.s !== 'ok') return [];
  return res.data.t.map((ts, i) => ({
    date: ts * 1000,
    close: res.data.c[i],
    open: res.data.o[i],
    high: res.data.h[i],
    low: res.data.l[i],
    volume: res.data.v[i],
  }));
};

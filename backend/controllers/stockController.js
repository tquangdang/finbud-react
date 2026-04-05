import Stock from '../models/Stock.js';
import { getQuote, searchSymbol, getCompanyProfile, getCandles } from '../services/stockService.js';

export const getStocks = async (req, res) => {
    try {
        const { symbol } = req.query;
        const query = symbol ? { symbol } : {};
        const stocks = await Stock.find(query);
        res.json(stocks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stocks' });
    }
};

export const getStock = async (req, res) => {
    try {
        const { symbol } = req.params;
        const stock = await Stock.findOne({ symbol });
        if (!stock) return res.status(404).json({ error: 'Stock not found' });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
};

export const createStock = async (req, res) => {
    try {
        const { symbol, open, high, low, close, change, volume, date } = req.body;
        const stock = await Stock.create({ symbol, open, high, low, close, change, volume, date });
        res.status(201).json(stock);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create stock' });
    }
};

export const getLiveQuote = async (req, res) => {
    try {
        const quote = await getQuote(req.params.symbol);
        if (!quote.currentPrice) {
            return res.status(404).json({ error: 'Symbol not found' });
        }
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
};

export const search = async (req, res) => {
    try {
        const results = await searchSymbol(req.query.q || '');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const profile = await getCompanyProfile(req.params.symbol);
        if (!profile.name) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const getChart = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { range = '1M' } = req.query;

        const now = Math.floor(Date.now() / 1000);
        const ranges = {
            '1W': 7 * 86400,
            '1M': 30 * 86400,
            '3M': 90 * 86400,
            '1Y': 365 * 86400,
        };
        const from = now - (ranges[range] || ranges['1M']);

        const candles = await getCandles(symbol, from, now);
        res.json(candles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
};


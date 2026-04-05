import express from 'express';
import { getStocks, getStock, createStock, getLiveQuote, search, getProfile, getChart } from '../controllers/stockController.js';

const router = express.Router();

router.get('/search', search);
router.get('/quote/:symbol', getLiveQuote);
router.get('/profile/:symbol', getProfile);
router.get('/chart/:symbol', getChart);
router.get('/', getStocks);
router.get('/:symbol', getStock);
router.post('/', createStock);

export default router;

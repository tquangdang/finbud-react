import axios from 'axios';

let ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
if (!ML_SERVICE_URL.startsWith('http')) ML_SERVICE_URL = `https://${ML_SERVICE_URL}`;

export const getStockPrediction = async (symbol, daysAhead = 365) => {
  const res = await axios.post(`${ML_SERVICE_URL}/predict`, {
    symbol,
    days_ahead: daysAhead,
  });
  return res.data;
};

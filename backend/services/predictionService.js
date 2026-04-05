import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const getStockPrediction = async (symbol, daysAhead = 365) => {
  const res = await axios.post(`${ML_SERVICE_URL}/predict`, {
    symbol,
    days_ahead: daysAhead,
  });
  return res.data;
};

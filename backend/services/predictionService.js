import axios from 'axios';

let ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
if (!ML_SERVICE_URL.startsWith('http')) ML_SERVICE_URL = `https://${ML_SERVICE_URL}`;

export const pingMLService = async () => {
  try {
    await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
  } catch {
    // ML service might be waking up — ignore
  }
};

export const getStockPrediction = async (symbol, { daysAhead = 365, trainingYears = 2 } = {}) => {
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/predict`, {
      symbol,
      days_ahead: daysAhead,
      training_years: trainingYears,
    }, { timeout: 55000 });
    return res.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw new Error(`The ML prediction service is currently unavailable. Please try again in a few minutes.`);
    }
    const detail = err.response?.data?.detail;
    if (detail) throw new Error(detail);
    throw err;
  }
};

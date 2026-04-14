import axios from 'axios';

let ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
if (!ML_SERVICE_URL.startsWith('http')) ML_SERVICE_URL = `https://${ML_SERVICE_URL}`;

export const pingMLService = async () => {
  for (let i = 0; i < 3; i++) {
    try {
      await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 15000 });
      return;
    } catch {
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
};

export const getStockPrediction = async (symbol, { daysAhead = 365, trainingYears = 2 } = {}) => {
  await pingMLService();

  const tryPredict = () => axios.post(`${ML_SERVICE_URL}/predict`, {
    symbol,
    days_ahead: daysAhead,
    training_years: trainingYears,
  }, { timeout: 55000 });

  try {
    const res = await tryPredict();
    return res.data;
  } catch (firstErr) {
    if (firstErr.code === 'ECONNREFUSED' || firstErr.code === 'ECONNRESET') {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await tryPredict();
        return res.data;
      } catch { /* fall through to original error handling */ }
    }
    if (firstErr.code === 'ECONNREFUSED' || firstErr.code === 'ECONNABORTED' || firstErr.code === 'ETIMEDOUT') {
      throw new Error(`The ML prediction service is currently unavailable. Please try again in a few minutes.`);
    }
    const detail = firstErr.response?.data?.detail;
    if (detail) throw new Error(detail);
    throw firstErr;
  }
};

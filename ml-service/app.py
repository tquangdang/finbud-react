import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta

logging.getLogger('cmdstanpy').setLevel(logging.WARNING)
logging.getLogger('prophet').setLevel(logging.WARNING)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    symbol: str
    days_ahead: int = 365
    training_years: int = 2

class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predictions: list
    model_info: dict

@app.get("/health")
def health():
    return {"status": "ok", "service": "finbud-ml"}

@app.on_event("startup")
def warmup():
    """Force Prophet/Stan compilation on startup instead of first request."""
    try:
        small_df = pd.DataFrame({
            "ds": pd.date_range("2024-01-01", periods=30, freq="D"),
            "y": list(range(30)),
        })
        m = Prophet(daily_seasonality=False, weekly_seasonality=False, yearly_seasonality=False)
        m.fit(small_df)
    except Exception:
        pass


@app.get("/chart/{symbol}")
def chart(symbol: str, range: str = "1M"):
    period_map = {"1W": "5d", "1M": "1mo", "3M": "3mo", "1Y": "1y"}
    period = period_map.get(range, "1mo")

    try:
        ticker = yf.Ticker(symbol.upper())
        df = ticker.history(period=period)
    except Exception:
        return []

    if df.empty:
        return []

    data = []
    for date, row in df.iterrows():
        data.append({
            "date": int(date.timestamp() * 1000),
            "close": round(row["Close"], 2),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "volume": int(row["Volume"]),
        })
    return data

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    symbol = req.symbol.upper()

    years = max(1, min(req.training_years, 10))
    period = f"{years}y"

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Could not fetch data for {symbol}")

    if df.empty or len(df) < 60:
        raise HTTPException(status_code=400, detail=f"Not enough data for {symbol}")

    # Prepare data for Prophet (needs columns: ds, y)
    prophet_df = df.reset_index()[["Date", "Close"]].rename(
        columns={"Date": "ds", "Close": "y"}
    )
    prophet_df["ds"] = pd.to_datetime(prophet_df["ds"]).dt.tz_localize(None)

    # Train Prophet model
    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=True,
        changepoint_prior_scale=0.05,
    )
    model.fit(prophet_df)

    # Make future predictions
    future = model.make_future_dataframe(periods=req.days_ahead)
    forecast = model.predict(future)

    # Get only the future predictions (after last known date)
    last_date = prophet_df["ds"].max()
    future_only = forecast[forecast["ds"] > last_date]

    predictions = []
    for _, row in future_only.iterrows():
        if row["ds"].day == 1:
            predictions.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted_price": round(row["yhat"], 2),
                "lower_bound": round(row["yhat_lower"], 2),
                "upper_bound": round(row["yhat_upper"], 2),
            })

    last_valid_close = df["Close"].dropna().iloc[-1]
    current_price = round(float(last_valid_close), 2)

    return PredictionResponse(
        symbol=symbol,
        current_price=current_price,
        predictions=predictions,
        model_info={
            "training_data_points": len(prophet_df),
            "training_period": f"{prophet_df['ds'].min().strftime('%Y-%m-%d')} to {prophet_df['ds'].max().strftime('%Y-%m-%d')}",
            "prediction_days": req.days_ahead,
        },
    )

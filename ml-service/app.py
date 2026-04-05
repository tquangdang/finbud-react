import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta

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

class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predictions: list
    model_info: dict

@app.get("/health")
def health():
    return {"status": "ok", "service": "finbud-ml"}

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    symbol = req.symbol.upper()

    # Fetch 3 years of historical data
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="3y")
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

    # Format predictions (sample monthly to keep response small)
    predictions = []
    for _, row in future_only.iterrows():
        if row["ds"].day <= 7:  # roughly monthly samples
            predictions.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted_price": round(row["yhat"], 2),
                "lower_bound": round(row["yhat_lower"], 2),
                "upper_bound": round(row["yhat_upper"], 2),
            })

    current_price = round(df["Close"].iloc[-1], 2)

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

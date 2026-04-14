import OpenAI from 'openai';
import { getStockPrediction, pingMLService } from './predictionService.js';
import { searchSymbol, getQuote } from './stockService.js';

let openai;
function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const SYSTEM_PROMPT = `You are FinBud, a friendly and knowledgeable financial assistant. Follow these rules:

PERSONALITY:
- Warm, professional, and conversational — like a smart friend who knows finance
- Use markdown formatting: **bold** for emphasis, headings, and bullet points for readability
- Use relevant emojis sparingly to make responses visually appealing (📈 📉 💰 🎯 📊 💡 ⚠️)
- Keep paragraphs short (2-3 sentences max)

FORMATTING:
- Use ## for section headings
- Use tables when comparing numbers
- Use > blockquotes for important warnings or disclaimers
- Break up long responses with clear sections
- Numbers should be formatted nicely ($1,234.56 not 1234.56)

CONTENT:
- Be concise but thorough — aim for helpful, not verbose
- When discussing stocks, always mention that this is not financial advice
- Give actionable insights, not just raw data
- If you don't know something, say so honestly

WHEN PRESENTING PREDICTION DATA:
You receive data from a Facebook Prophet time-series forecasting model. Present it with technical depth:

1. **## 📊 How This Prediction Was Made**
   - Explain that the model is Facebook Prophet, a time-series decomposition model developed by Meta
   - State how many data points it trained on and the exact training period (from training_info)
   - Briefly explain what Prophet does: it decomposes historical prices into trend (long-term direction), weekly seasonality (day-of-week patterns), and yearly seasonality (annual cycles like earnings seasons, holiday rallies), then projects these forward
   - Mention the changepoint detection: Prophet identifies points where the stock's trend shifted significantly, which helps it adapt to recent momentum changes

2. **## 💰 Current Price & Outlook**
   - Show the current price and overall projected change percentage
   - State the trend direction explicitly

3. **## 📈 Price Forecast**
   - DO NOT include a table of monthly predictions — the app automatically renders an interactive chart and visual card from the raw data
   - Instead, briefly summarize the price trajectory in 1-2 sentences (e.g. "The model projects steady growth from $X to $Y over the next 12 months")
   - Mention 1-2 notable milestones or seasonal patterns visible in the data

4. **## 🔍 Key Insights**
   - Analyze the actual shape of the predictions: is growth steady/accelerating/decelerating? Are there seasonal dips? Does the confidence range get very wide (meaning high uncertainty)?
   - If long-term price is lower than mid-term, explain this is likely due to yearly seasonality patterns the model detected in the historical data, not necessarily a reversal
   - Compare the confidence range width at 3 months vs 12 months to illustrate increasing uncertainty
   - Mention specific factors Prophet CANNOT account for: earnings surprises, new product launches, market crashes, regulatory changes, macroeconomic shifts

5. **## ⚠️ Understanding the Limitations**
   - Prophet assumes future patterns will resemble past patterns — this works well for stable stocks but less so for volatile or rapidly changing companies
   - The wider the confidence interval, the less certain the model is
   - End with: this is a statistical projection, not financial advice — always combine with fundamental analysis and your own research

WHEN PRESENTING STOCK QUOTES:
- Show the current price prominently
- Highlight the change (positive/negative) with appropriate emoji
- Mention key stats concisely`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_stock_prediction',
      description:
        'Get ML-based stock price prediction using a Prophet forecasting model. Call this when the user asks about future stock prices, predictions, forecasts, or where a stock price is heading.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description:
              'Stock ticker symbol (e.g. TSLA, AAPL, MSFT, GOOGL). Convert company names to their ticker symbols.',
          },
          training_years: {
            type: 'integer',
            description:
              'How many years of historical data to train the model on (1-10). Use more years if the user mentions a longer history. Default 2.',
          },
          days_ahead: {
            type: 'integer',
            description:
              'How many days into the future to predict (default 365). Use 180 for 6 months, 730 for 2 years, etc.',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_quote',
      description:
        'Get current live stock price, daily change, and key statistics (open, high, low, previous close). Call this when the user asks about current stock prices or wants real-time market data.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol (e.g. TSLA, AAPL, MSFT)',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_stock_symbol',
      description:
        'Search for a stock ticker symbol by company name or partial name. Use this when the user mentions a company and you are unsure of its exact ticker symbol.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Company name or partial name to search for',
          },
        },
        required: ['query'],
      },
    },
  },
];

const TOOL_STATUS_LABELS = {
  get_stock_prediction: '📊 Running prediction model',
  get_stock_quote: '💰 Fetching live market data',
  search_stock_symbol: '🔍 Looking up stock symbol',
};

async function executeToolCall(name, args) {
  switch (name) {
    case 'get_stock_prediction': {
      let symbol = (args.symbol || '').toUpperCase();
      if (!/^[A-Z]{1,5}$/.test(symbol)) {
        const results = await searchSymbol(args.symbol);
        if (results.length > 0) {
          symbol = results[0].symbol;
        } else {
          return JSON.stringify({ error: `Could not find a stock ticker for "${args.symbol}". Please check the company name or provide a valid ticker symbol like AAPL, TSLA, MSFT.` });
        }
      }
      const prediction = await getStockPrediction(symbol, {
        daysAhead: args.days_ahead || 365,
        trainingYears: args.training_years || 2,
      });
      const predictions = prediction.predictions;
      const last = predictions[predictions.length - 1];
      const currentPrice = prediction.current_price;
      let pctChange = '0';
      if (last && currentPrice && currentPrice > 0) {
        pctChange = (((last.predicted_price - currentPrice) / currentPrice) * 100).toFixed(1);
      }
      return JSON.stringify({
        symbol,
        current_price: currentPrice,
        trend: last && currentPrice && last.predicted_price >= currentPrice
          ? 'upward' : 'downward',
        projected_change_pct: pctChange,
        training_info: prediction.model_info,
        monthly_predictions: predictions,
      });
    }
    case 'get_stock_quote': {
      const quote = await getQuote((args.symbol || '').toUpperCase());
      return JSON.stringify(quote);
    }
    case 'search_stock_symbol': {
      const results = await searchSymbol(args.query || '');
      return JSON.stringify(results.slice(0, 5));
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

/**
 * Async generator that streams AI responses token-by-token.
 * Yields objects: { type: 'token', content } or { type: 'status', message }
 */
const MAX_HISTORY_PAIRS = 20;

export async function* streamAIResponse(prompt, chatHistory = []) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  const recentHistory = chatHistory.slice(-MAX_HISTORY_PAIRS);
  for (const chat of recentHistory) {
    messages.push({ role: 'user', content: chat.prompt });
    messages.push({ role: 'assistant', content: (chat.response?.[0] || '').slice(0, 4000) });
  }

  messages.push({ role: 'user', content: prompt });

  const stream = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    stream: true,
  });

  const toolCallsMap = {};
  let finishReason = null;

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;
    finishReason = choice.finish_reason;
    const delta = choice.delta;

    if (delta?.content) {
      yield { type: 'token', content: delta.content };
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;
        if (!toolCallsMap[idx]) {
          toolCallsMap[idx] = { id: '', name: '', arguments: '' };
        }
        if (tc.id) toolCallsMap[idx].id = tc.id;
        if (tc.function?.name)
          toolCallsMap[idx].name = tc.function.name;
        if (tc.function?.arguments)
          toolCallsMap[idx].arguments += tc.function.arguments;
      }
    }
  }

  if (
    finishReason === 'tool_calls' &&
    Object.keys(toolCallsMap).length > 0
  ) {
    const toolCallsList = Object.values(toolCallsMap);

    const needsML = toolCallsList.some((tc) => tc.name === 'get_stock_prediction');
    if (needsML) await pingMLService();

    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCallsList.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    let forecastPayload = null;

    for (const tc of toolCallsList) {
      const label =
        TOOL_STATUS_LABELS[tc.name] || 'Processing';
      yield { type: 'status', message: `${label}...` };

      let result;
      try {
        const args = JSON.parse(tc.arguments);
        result = await executeToolCall(tc.name, args);
      } catch (err) {
        const toolLabel = TOOL_STATUS_LABELS[tc.name] || tc.name;
        result = JSON.stringify({
          error: err.message || 'An unexpected error occurred',
          tool: tc.name,
          hint: `Tell the user that ${toolLabel} failed and suggest they try again or check the stock symbol.`,
        });
      }

      if (tc.name === 'get_stock_prediction' && result && !result.includes('"error"')) {
        forecastPayload = result;
      }

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      });
    }

    if (forecastPayload) {
      yield { type: 'token', content: '```forecast\n' + forecastPayload + '\n```\n\n' };
    }

    const followUpStream = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
    });

    for await (const chunk of followUpStream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { type: 'token', content: delta.content };
      }
    }
  }
}

export const getAIResponse = async (prompt, chatHistory = []) => {
  let fullResponse = '';
  for await (const event of streamAIResponse(prompt, chatHistory)) {
    if (event.type === 'token') fullResponse += event.content;
  }
  return fullResponse;
};

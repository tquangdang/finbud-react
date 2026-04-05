import OpenAI from 'openai';
import { getStockPrediction } from './predictionService.js';
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
1. Start with a brief intro line about the stock and current price
2. Use a "## 📊 Prediction Summary" heading
3. Mention the overall trend direction and percentage
4. Present the timeframes using a markdown table with columns: Timeframe, Date, Price, Confidence Range
5. Add a "## 💡 What This Means" section with 2-3 bullet points interpreting the data
6. End with a "> ⚠️ **Disclaimer**" blockquote that predictions are ML-based estimates, not financial advice

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
      let symbol = args.symbol.toUpperCase();
      if (!/^[A-Z]{1,5}$/.test(symbol)) {
        const results = await searchSymbol(args.symbol);
        if (results.length > 0) symbol = results[0].symbol;
      }
      const prediction = await getStockPrediction(symbol);
      const first = prediction.predictions[0];
      const mid =
        prediction.predictions[
          Math.floor(prediction.predictions.length / 2)
        ];
      const last =
        prediction.predictions[prediction.predictions.length - 1];
      const pctChange = (
        ((last.predicted_price - prediction.current_price) /
          prediction.current_price) *
        100
      ).toFixed(1);
      return JSON.stringify({
        symbol,
        current_price: prediction.current_price,
        trend:
          last.predicted_price >= prediction.current_price
            ? 'upward'
            : 'downward',
        projected_change_pct: pctChange,
        training_info: prediction.model_info,
        near_term: first,
        mid_term: mid,
        long_term: last,
      });
    }
    case 'get_stock_quote': {
      const quote = await getQuote(args.symbol.toUpperCase());
      return JSON.stringify(quote);
    }
    case 'search_stock_symbol': {
      const results = await searchSymbol(args.query);
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
export async function* streamAIResponse(prompt, chatHistory = []) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const chat of chatHistory) {
    messages.push({ role: 'user', content: chat.prompt });
    messages.push({ role: 'assistant', content: chat.response[0] });
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

    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCallsList.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    for (const tc of toolCallsList) {
      const label =
        TOOL_STATUS_LABELS[tc.name] || 'Processing';
      yield { type: 'status', message: `${label}...` };

      let result;
      try {
        const args = JSON.parse(tc.arguments);
        result = await executeToolCall(tc.name, args);
      } catch (err) {
        result = JSON.stringify({ error: err.message });
      }
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      });
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

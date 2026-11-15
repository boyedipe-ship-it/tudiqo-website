const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : { messages: [], tier: 'standard' };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const key = process.env.ANTHROPIC_API_KEY;

    if (!key) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const model = body.tier === 'quick' ? 'claude-haiku-4-20250514' : 'claude-sonnet-4-20250514';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1600,
        messages,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: 'Anthropic request failed', detail: text }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const payload = JSON.parse(text);
    const reply = payload.content
      ?.map((c) => (c.type === 'text' ? c.text : '')).join('')
      .trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ text: reply || '' }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', detail: String(err) }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

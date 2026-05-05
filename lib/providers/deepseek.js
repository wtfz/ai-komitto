export async function generateWithDeepSeek(prompt, model) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const selectedModel = model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  if (!apiKey) throw new Error('missing DEEPSEEK_API_KEY');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 40,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'deepseek request failed');

  return json?.choices?.[0]?.message?.content || '';
}

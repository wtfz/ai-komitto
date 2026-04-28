export async function generateWithClaude(prompt, model) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const selectedModel = model || process.env.CLAUDE_MODEL || 'claude-haiku-4-5';

  if (!apiKey) throw new Error('missing ANTHROPIC_API_KEY');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 40,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'claude request failed');

  return json?.content?.[0]?.text || '';
}

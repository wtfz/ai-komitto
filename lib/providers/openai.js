export async function generateWithOpenAI(prompt, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-5.4-nano';

  if (!apiKey) throw new Error('missing OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      input: prompt,
      max_output_tokens: 40
    })
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'openai request failed');

  if (json.output_text) return json.output_text;

  return json?.output
    ?.flatMap((item) => item.content || [])
    ?.map((content) => content.text || '')
    ?.join('') || '';
}

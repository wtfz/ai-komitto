import { warnIfDeprecated } from '../utils.js';

export async function generateWithOpenAI(prompt, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-6-luna';

  if (!apiKey) throw new Error('missing OPENAI_API_KEY');
  warnIfDeprecated(selectedModel);

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: selectedModel,
      input: prompt,
      // reasoning tokens count toward this cap, so leave room for the message
      max_output_tokens: 1024,
      // luna models default to medium reasoning; other models either reject 'none' or don't need it
      ...(selectedModel.includes('-luna') && { reasoning: { effort: 'none' } })
    })
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'openai request failed');

  if (json.status === 'incomplete' && json.incomplete_details?.reason === 'max_output_tokens') {
    throw new Error('openai stopped at the output token cap before finishing the message; try a model that reasons less, such as gpt-6-luna');
  }

  if (json.output_text) return json.output_text;

  return json?.output
    ?.flatMap((item) => item.content || [])
    ?.map((content) => content.text || '')
    ?.join('') || '';
}

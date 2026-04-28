export async function generateWithGemini(prompt, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  const selectedModel = model || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

  if (!apiKey) throw new Error('missing GEMINI_API_KEY');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 40
        }
      })
    }
  );

  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || 'gemini request failed');

  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

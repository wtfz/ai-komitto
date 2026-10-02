import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWithOpenAI } from '../lib/providers/openai.js';
import { generateWithDeepSeek } from '../lib/providers/deepseek.js';

const openAIResponse = {
  id: 'resp_test',
  object: 'response',
  status: 'completed',
  model: 'gpt-6-luna',
  output: [
    {
      id: 'msg_test',
      type: 'message',
      status: 'completed',
      role: 'assistant',
      content: [{ type: 'output_text', text: 'feat: add login', annotations: [] }]
    }
  ],
  usage: { input_tokens: 12, output_tokens: 5, total_tokens: 17 }
};

const deepSeekResponse = {
  id: 'chat_test',
  object: 'chat.completion',
  model: 'deepseek-flash',
  choices: [
    { index: 0, message: { role: 'assistant', content: 'feat: add login' }, finish_reason: 'stop' }
  ],
  usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 }
};

function setEnv(values) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function captureRequest({ env, response }, call) {
  const originalFetch = globalThis.fetch;
  const originalEnv = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  const requests = [];

  setEnv(env);
  globalThis.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => response };
  };

  try {
    const text = await call();
    assert.equal(requests.length, 1);
    return { text, request: requests[0] };
  } finally {
    globalThis.fetch = originalFetch;
    setEnv(originalEnv);
  }
}

test('openai defaults to gpt-6-luna with reasoning turned off', async () => {
  const { text, request } = await captureRequest(
    { env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: undefined }, response: openAIResponse },
    () => generateWithOpenAI('prompt')
  );

  assert.equal(text, 'feat: add login');
  assert.equal(request.body.model, 'gpt-6-luna');
  assert.deepEqual(request.body.reasoning, { effort: 'none' });
});

test('openai sends no reasoning setting to models outside the luna tier', async () => {
  const { request } = await captureRequest(
    { env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: undefined }, response: openAIResponse },
    () => generateWithOpenAI('prompt', 'gpt-6.1-sol')
  );

  assert.equal(request.body.model, 'gpt-6.1-sol');
  assert.equal('reasoning' in request.body, false);
});

test('openai warns when the configured model is deprecated', async () => {
  const warnings = [];
  const originalError = console.error;
  console.error = (message) => warnings.push(message);

  try {
    await captureRequest(
      { env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-5.4-nano' }, response: openAIResponse },
      () => generateWithOpenAI('prompt')
    );
  } finally {
    console.error = originalError;
  }

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /gpt-5\.4-nano.*gpt-6-luna/);
});

test('openai turns reasoning off for dated luna snapshots', async () => {
  const { request } = await captureRequest(
    { env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: undefined }, response: openAIResponse },
    () => generateWithOpenAI('prompt', 'gpt-6-luna-2026-12-01')
  );

  assert.deepEqual(request.body.reasoning, { effort: 'none' });
});

test('openai uses the --model value, then OPENAI_MODEL, then the default', async () => {
  const cases = [
    { model: 'gpt-6.1-sol', envModel: 'gpt-5.4-mini', want: 'gpt-6.1-sol' },
    { model: undefined, envModel: 'gpt-5.4-mini', want: 'gpt-5.4-mini' },
    { model: undefined, envModel: undefined, want: 'gpt-6-luna' }
  ];

  for (const { model, envModel, want } of cases) {
    const { request } = await captureRequest(
      { env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: envModel }, response: openAIResponse },
      () => generateWithOpenAI('prompt', model)
    );

    assert.equal(request.body.model, want);
  }
});

test('openai fails fast instead of returning a message cut off at the token cap', async () => {
  const truncatedResponse = {
    id: 'resp_test',
    object: 'response',
    status: 'incomplete',
    incomplete_details: { reason: 'max_output_tokens' },
    model: 'gpt-6.1-sol',
    output: [
      { id: 'rs_test', type: 'reasoning', summary: [] },
      {
        id: 'msg_test',
        type: 'message',
        status: 'incomplete',
        role: 'assistant',
        content: [{ type: 'output_text', text: 'feat: add user avat', annotations: [] }]
      }
    ],
    usage: {
      input_tokens: 12,
      output_tokens: 1024,
      output_tokens_details: { reasoning_tokens: 1019 },
      total_tokens: 1036
    }
  };

  await assert.rejects(
    captureRequest(
      { env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: undefined }, response: truncatedResponse },
      () => generateWithOpenAI('prompt', 'gpt-6.1-sol')
    ),
    { message: /output token cap/ }
  );
});

test('deepseek defaults to deepseek-flash', async () => {
  const { text, request } = await captureRequest(
    { env: { DEEPSEEK_API_KEY: 'test-key', DEEPSEEK_MODEL: undefined }, response: deepSeekResponse },
    () => generateWithDeepSeek('prompt')
  );

  assert.equal(text, 'feat: add login');
  assert.equal(request.body.model, 'deepseek-flash');
});

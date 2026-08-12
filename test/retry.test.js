import assert from 'node:assert/strict';
import test from 'node:test';

async function loadRetryHelper() {
  try {
    return await import('../lib/retry.js');
  } catch (error) {
    assert.fail(`retry helper must be available: ${error.message}`);
  }
}

test('returns the first non-empty cleaned commit message without retrying', async () => {
  const { generateCommitMessageWithRetry } = await loadRetryHelper();
  let calls = 0;
  const delays = [];
  const retries = [];

  const message = await generateCommitMessageWithRetry({
    generate: async () => {
      calls += 1;
      return "'feat: add empty response retries.'";
    },
    format: 'conventional',
    maxTurns: 5,
    retryDelayMs: 1000,
    sleep: async (delayMs) => delays.push(delayMs),
    onRetry: (retry) => retries.push(retry)
  });

  assert.equal(message, 'feat: add empty response retries');
  assert.equal(calls, 1);
  assert.deepEqual(delays, []);
  assert.deepEqual(retries, []);
});

test('retries cleaned empty responses with a linear delay', async () => {
  const { generateCommitMessageWithRetry } = await loadRetryHelper();
  const responses = ['   ', '```', 'fix: return generated commit message'];
  const delays = [];
  const retries = [];

  const message = await generateCommitMessageWithRetry({
    generate: async () => responses.shift(),
    format: 'conventional',
    maxTurns: 5,
    retryDelayMs: 1000,
    sleep: async (delayMs) => delays.push(delayMs),
    onRetry: (retry) => retries.push(retry)
  });

  assert.equal(message, 'fix: return generated commit message');
  assert.deepEqual(delays, [1000, 2000]);
  assert.deepEqual(retries, [
    { nextTurn: 2, maxTurns: 5, delayMs: 1000 },
    { nextTurn: 3, maxTurns: 5, delayMs: 2000 }
  ]);
});

test('fails after the maximum number of empty turns', async () => {
  const { generateCommitMessageWithRetry } = await loadRetryHelper();
  let calls = 0;
  const delays = [];

  await assert.rejects(
    generateCommitMessageWithRetry({
      generate: async () => {
        calls += 1;
        return '';
      },
      format: 'conventional',
      maxTurns: 5,
      retryDelayMs: 1000,
      sleep: async (delayMs) => delays.push(delayMs)
    }),
    { message: 'provider returned an empty commit message after 5 turns' }
  );

  assert.equal(calls, 5);
  assert.deepEqual(delays, [1000, 2000, 3000, 4000]);
});

test('does not retry provider exceptions', async () => {
  const { generateCommitMessageWithRetry } = await loadRetryHelper();
  const providerError = new Error('provider unavailable');
  let calls = 0;
  const delays = [];

  await assert.rejects(
    generateCommitMessageWithRetry({
      generate: async () => {
        calls += 1;
        throw providerError;
      },
      format: 'conventional',
      maxTurns: 5,
      retryDelayMs: 1000,
      sleep: async (delayMs) => delays.push(delayMs)
    }),
    providerError
  );

  assert.equal(calls, 1);
  assert.deepEqual(delays, []);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import * as utils from '../lib/utils.js';

test('parses retry command-line options', () => {
  assert.deepEqual(
    utils.parseArgs(['--max-turns', '3', '--retry-delay=0.5']),
    {
      add: true,
      language: 'english',
      maxTurns: '3',
      retryDelay: '0.5'
    }
  );
});

test('uses retry defaults when no overrides are configured', () => {
  assert.deepEqual(utils.parseRetryOptions({}, {}), {
    maxTurns: 5,
    retryDelayMs: 1000
  });
});

test('command-line retry options override environment values', () => {
  const args = utils.parseArgs(['--max-turns=3', '--retry-delay', '0.5']);

  assert.deepEqual(
    utils.parseRetryOptions(args, {
      KOMITTO_MAX_TURNS: '8',
      KOMITTO_RETRY_DELAY: '2'
    }),
    {
      maxTurns: 3,
      retryDelayMs: 500
    }
  );
});

test('supports environment retry options and zero delay', () => {
  assert.deepEqual(
    utils.parseRetryOptions({}, {
      KOMITTO_MAX_TURNS: '2',
      KOMITTO_RETRY_DELAY: '0'
    }),
    {
      maxTurns: 2,
      retryDelayMs: 0
    }
  );
});

test('rejects invalid maximum turn values', () => {
  for (const maxTurns of ['0', '-1', '1.5', 'invalid']) {
    assert.throws(
      () => utils.parseRetryOptions({ maxTurns }, {}),
      { message: '--max-turns must be an integer greater than or equal to 1' }
    );
  }
});

test('rejects invalid retry delay values', () => {
  for (const retryDelay of ['-1', 'Infinity', 'invalid']) {
    assert.throws(
      () => utils.parseRetryOptions({ retryDelay }, {}),
      { message: '--retry-delay must be a finite number greater than or equal to 0' }
    );
  }
});

test('warns once per deprecated model and names the replacement', () => {
  const warnings = [];

  utils.warnIfDeprecated('gpt-5.4-nano', (message) => warnings.push(message));
  utils.warnIfDeprecated('gpt-5.4-nano', (message) => warnings.push(message));

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /gpt-5\.4-nano.*gpt-6-luna/);
});

test('does not warn for current or unknown models', () => {
  const warnings = [];

  for (const model of ['gpt-6-luna', 'deepseek-flash', 'constructor']) {
    utils.warnIfDeprecated(model, (message) => warnings.push(message));
  }

  assert.deepEqual(warnings, []);
});

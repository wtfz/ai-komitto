import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const commandUrl = pathToFileURL(join(projectRoot, 'bin/komitto.js')).href;

function git(repository, args) {
  return execFileSync('git', args, { cwd: repository, encoding: 'utf8' }).trim();
}

function createRepository() {
  const repository = mkdtempSync(join(tmpdir(), 'komitto-test-'));
  git(repository, ['init', '--quiet']);
  git(repository, ['config', 'user.name', 'Komet Test']);
  git(repository, ['config', 'user.email', 'komet@example.com']);
  writeFileSync(join(repository, 'example.txt'), 'before\n');
  git(repository, ['add', 'example.txt']);
  git(repository, ['commit', '--quiet', '-m', 'chore: initialize fixture']);
  writeFileSync(join(repository, 'example.txt'), 'after\n');
  return repository;
}

function runKomitto(repository, args, responses) {
  const runner = `
    const responses = JSON.parse(process.env.KOMITTO_TEST_RESPONSES);
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: responses.shift() ?? '' } }]
      })
    });
    process.argv = ['node', 'komitto', ...JSON.parse(process.env.KOMITTO_TEST_ARGS)];
    await import(${JSON.stringify(commandUrl)});
  `;

  return spawnSync(process.execPath, ['--input-type=module', '--eval', runner], {
    cwd: repository,
    encoding: 'utf8',
    env: {
      ...process.env,
      DEEPSEEK_API_KEY: 'test-key',
      KOMITTO_TEST_ARGS: JSON.stringify(args),
      KOMITTO_TEST_RESPONSES: JSON.stringify(responses)
    }
  });
}

test('print and dry-run modes retry without creating a commit', async (t) => {
  for (const mode of ['--print', '--dry-run']) {
    await t.test(mode, () => {
      const repository = createRepository();

      try {
        const result = runKomitto(
          repository,
          [mode, '--provider', 'deepseek', '--max-turns', '3', '--retry-delay', '0'],
          ['', '```', 'feat: retry empty commit messages']
        );

        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout.trim(), 'feat: retry empty commit messages');
        assert.match(result.stderr, /retrying in 0s \(turn 2\/3\)/);
        assert.match(result.stderr, /retrying in 0s \(turn 3\/3\)/);
        assert.equal(git(repository, ['rev-list', '--count', 'HEAD']), '1');
      } finally {
        rmSync(repository, { recursive: true, force: true });
      }
    });
  }
});

test('normal mode creates one commit after receiving a message', () => {
  const repository = createRepository();

  try {
    const result = runKomitto(
      repository,
      ['--provider=deepseek', '--max-turns=1', '--retry-delay=0'],
      ['fix: commit after message generation']
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(git(repository, ['rev-list', '--count', 'HEAD']), '2');
    assert.equal(git(repository, ['log', '-1', '--pretty=%s']), 'fix: commit after message generation');
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});

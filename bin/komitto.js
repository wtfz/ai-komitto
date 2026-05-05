#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { generateWithOpenAI } from '../lib/providers/openai.js';
import { generateWithClaude } from '../lib/providers/claude.js';
import { generateWithGemini } from '../lib/providers/gemini.js';
import { generateWithDeepSeek } from '../lib/providers/deepseek.js';
import { buildPrompt, cleanMessage, parseArgs, usage } from '../lib/utils.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  const provider = args.provider || process.env.KOMITTO_PROVIDER || 'deepseek';
  const root = git(['rev-parse', '--show-toplevel']).trim();

  if (args.add !== false) {
    git(['add', root], { stdio: 'inherit' });
  }

  const changed = git(['diff', '--cached', '--name-only']).trim();
  if (!changed) {
    console.error('nothing to commit');
    process.exit(1);
  }

  const diff = getDiff(args);
  const minWords = parseInt(args.minWords || process.env.KOMITTO_MIN_WORDS || '12', 10);
  const format = args.format || process.env.KOMITTO_FORMAT || 'conventional';
  const context = args.context || process.env.KOMITTO_CONTEXT || '';
  const prompt = buildPrompt(diff, args.language || 'english', minWords, format, context);

  let message;

  if (provider === 'openai') {
    message = await generateWithOpenAI(prompt, args.model);
  } else if (provider === 'claude' || provider === 'anthropic') {
    message = await generateWithClaude(prompt, args.model);
  } else if (provider === 'gemini' || provider === 'google') {
    message = await generateWithGemini(prompt, args.model);
  } else if (provider === 'deepseek') {
    message = await generateWithDeepSeek(prompt, args.model);
  } else {
    throw new Error(`unsupported provider: ${provider}. use openai, claude, gemini, or deepseek`);
  }

  message = cleanMessage(message, format);

  if (args.lowercase) {
    message = message.toLowerCase();
  }

  if (!message) {
    throw new Error('provider returned an empty commit message');
  }

  console.log(message);

  if (args.printOnly || args.dryRun) {
    return;
  }

  git(['commit', '-m', message], { stdio: 'inherit' });
}

function getDiff(args) {
  const lockfileExcludes = [
    ':(exclude)package-lock.json',
    ':(exclude)yarn.lock',
    ':(exclude)pnpm-lock.yaml',
    ':(exclude)composer.lock'
  ];

  const diffArgs = ['diff', '--cached'];
  const stat = git([...diffArgs, '--stat']);
  const body = git([...diffArgs, '--', '.', ...lockfileExcludes]);

  const maxChars = Number(args.maxChars || process.env.KOMITTO_MAX_CHARS || 18000);
  return `${stat}\n\n${body}`.slice(0, maxChars);
}

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe']
  });
}

main().catch((error) => {
  console.error(`komitto failed: ${error.message}`);
  process.exit(1);
});

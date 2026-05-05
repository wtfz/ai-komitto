export function parseArgs(argv) {
  const args = { add: true, language: process.env.KOMITTO_LANGUAGE || 'english' };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--provider' || arg === '-p') args.provider = argv[++i];
    else if (arg.startsWith('--provider=')) args.provider = arg.split('=')[1];
    else if (arg === '--model' || arg === '-m') args.model = argv[++i];
    else if (arg.startsWith('--model=')) args.model = arg.split('=')[1];
    else if (arg === '--language' || arg === '-l') args.language = argv[++i];
    else if (arg.startsWith('--language=')) args.language = arg.split('=')[1];
    else if (arg === '--print' || arg === '--message-only') args.printOnly = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-add') args.add = false;
    else if (arg === '--max-chars') args.maxChars = argv[++i];
    else if (arg.startsWith('--max-chars=')) args.maxChars = arg.split('=')[1];
    else if (arg === '--min-words' || arg === '-w') args.minWords = argv[++i];
    else if (arg.startsWith('--min-words=')) args.minWords = arg.split('=')[1];
    else if (arg === '--format' || arg === '-f') args.format = argv[++i];
    else if (arg.startsWith('--format=')) args.format = arg.split('=')[1];
    else if (arg === '--lowercase' || arg === '-lc') args.lowercase = true;
  else if (arg === '--context' || arg === '-c') args.context = argv[++i];
    else if (arg.startsWith('--context=')) args.context = arg.split('=')[1];
  }

  return args;
}

const FORMAT_RULES = {
  plain: [
    '- do not use any prefix or convention',
  ],
  conventional: [
    '- use conventional commit prefix: fix:, feat:, refactor:, chore:, docs:, test:, style:, perf:, ci:, build:',
  ],
  gitmoji: [
    '- start with a relevant gitmoji (actual emoji character, not shortcode)',
    '- examples: 🐛 for fix, ✨ for feature, ♻️ for refactor, 🔧 for config, 📝 for docs',
  ],
  full: [
    '- write a short title line (min ${minWords} words) then a blank line then a body',
    '- the body should explain what changed and why in 2-4 bullet points',
    '- use conventional commit prefix on the title: fix:, feat:, refactor:, chore:',
  ],
};

const VALID_FORMATS = Object.keys(FORMAT_RULES);

export function buildPrompt(diff, language = 'english', minWords = 12, format = 'conventional', context = '') {
  if (!VALID_FORMATS.includes(format)) {
    throw new Error(`unsupported format: ${format}. use ${VALID_FORMATS.join(', ')}`);
  }

  const isFullFormat = format === 'full';
  const formatRules = FORMAT_RULES[format]
    .map(r => r.replace('${minWords}', minWords))
    .join('\n');

  return `Write a ${isFullFormat ? '' : 'one-line '}git commit message in ${language} for this staged diff.

Rules:${format === 'gitmoji' ? '\n- lowercase except emoji' : ''}
- use ${language} language
- concise
- no period at end${isFullFormat ? '' : '\n- no newlines'}
- no markdown
- no quotes
${isFullFormat ? '' : `- min ${minWords} words\n`}${formatRules}
- only output the commit message
${context ? `\nAdditional context:\n- ${context}\n` : ''}
Diff:
${diff}`;
}

export function cleanMessage(value, format = 'conventional') {
  const raw = String(value || '').trim().replace(/^['"`]+|['"`]+$/g, '');

  if (format === 'full') {
    return raw.replace(/[.。]+$/gm, '');
  }

  return raw
    .split('\n')[0]
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/[.。]+$/g, '')
    ;
}

export function usage() {
  return `ai-komitto

Usage:
  komitto [options]

Options:
  -p, --provider <name>   provider: gemini, openai, claude, deepseek
  -m, --model <model>     override provider model
  -l, --language <name>    commit message language, default: english
  --no-add                do not run git add before generating message
  --print                 print message only, do not commit
  --dry-run               same as --print
  --max-chars <number>    max diff characters sent to provider
  -w, --min-words <n>     min words in commit message, default: 12
  -f, --format <type>     commit format: plain, conventional, gitmoji, full
  -lc, --lowercase        transform commit message to lowercase
  -c, --context <text>    extra instructions for the commit message
  -h, --help              show help

Environment:
  KOMITTO_PROVIDER        default provider, default: deepseek
  KOMITTO_LANGUAGE        default language, default: english
  GEMINI_API_KEY          required for gemini
  OPENAI_API_KEY          required for openai
  ANTHROPIC_API_KEY       required for claude
  DEEPSEEK_API_KEY        required for deepseek
  GEMINI_MODEL            default: gemini-flash-lite-latest
  OPENAI_MODEL            default: gpt-5.4-nano
  CLAUDE_MODEL            default: claude-haiku-4-5
  DEEPSEEK_MODEL          default: deepseek-v4-flash
  KOMITTO_MAX_CHARS       maximum diff characters sent to provider
  KOMITTO_MIN_WORDS       min words in commit message, default: 12
  KOMITTO_FORMAT          commit format: plain, conventional, gitmoji, full
  KOMITTO_CONTEXT         extra instructions for the commit message
`;
}

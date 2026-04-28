export function parseArgs(argv) {
  const args = { add: true, language: process.env.KOMITTO_LANGUAGE || process.env.AIC_LANGUAGE || 'english' };

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
  }

  return args;
}

export function buildPrompt(diff, language = 'english') {
  return `Write a one-line git commit message in ${language} for this staged diff.

Rules:
- all lowercase
- use ${language} language
- concise
- no period
- no markdown
- no quotes
- max 12 words
- use conventional commit style if obvious, like fix:, feat:, refactor:, chore:
- only output the commit message

Diff:
${diff}`;
}

export function cleanMessage(value) {
  return String(value || '')
    .split('\n')[0]
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/[.。]+$/g, '')
    .toLowerCase();
}

export function usage() {
  return `ai-komitto

Usage:
  komitto [options]

Options:
  -p, --provider <name>   provider: gemini, openai, claude
  -m, --model <model>     override provider model
  -l, --language <name>    commit message language, default: english
  --no-add                do not run git add before generating message
  --print                 print message only, do not commit
  --dry-run               same as --print
  --max-chars <number>    max diff characters sent to provider
  -h, --help              show help

Environment:
  KOMITTO_PROVIDER        default provider
  AIC_PROVIDER            legacy default provider
  KOMITTO_LANGUAGE        default language, default: english
  GEMINI_API_KEY          required for gemini
  OPENAI_API_KEY          required for openai
  ANTHROPIC_API_KEY       required for claude
  GEMINI_MODEL            default: gemini-flash-lite-latest
  OPENAI_MODEL            default: gpt-5.4-nano
  CLAUDE_MODEL            default: claude-haiku-4-5
  KOMITTO_MAX_CHARS       maximum diff characters sent to provider
`;
}

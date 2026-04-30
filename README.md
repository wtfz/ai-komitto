<p align="center"><a href="https://www.npmjs.com/package/ai-komitto" target="_blank"><img src="https://raw.githubusercontent.com/wtfz/asset/master/ai-komitto-logo.png" width="200" alt="AI Komitto Logo"></a></p>

<p align="center">
<a href="https://www.npmjs.com/package/ai-komitto"><img src="https://img.shields.io/npm/v/ai-komitto.svg" alt="Latest Version"></a>
<a href="https://www.npmjs.com/package/ai-komitto"><img src="https://img.shields.io/npm/dm/ai-komitto.svg" alt="Total Downloads"></a>
<a href="https://www.npmjs.com/package/ai-komitto"><img src="https://img.shields.io/npm/l/ai-komitto.svg" alt="License"></a>
</p>

## About AI Komitto

Generate short Git commit messages from your staged diff using OpenAI, Claude, or Gemini.

AI Komitto is a small global CLI for developers who want fast commit messages without manually writing summaries. It stages your repository changes, sends the staged diff to your selected AI provider, prints the generated message, and commits with that message.

The command is intentionally short:

```bash
komitto
```

## Features

- Supports Google Gemini, OpenAI, and Anthropic Claude
- Global npm CLI installation
- Default lightweight model support
- Provider and model overrides
- Language option, defaulting to English
- Print-only mode for editor aliases and IDE tasks
- Lowercase one-line conventional-style commit messages
- Optional `--no-add` mode when you only want to summarize already staged files
- Configurable min word count for commit messages
- Multiple commit formats: plain, conventional, gitmoji, full (title + body)
- Custom context instructions to guide the commit message tone and content

## Why

Writing commit messages for small everyday changes is repetitive. This package turns this:

```bash
git add .
git commit -m "fix booking status translation"
```

into this:

```bash
komitto
```

Example output:

```bash
fix: update booking status translations
```

## Installation

Install globally:

```bash
npm install -g ai-komitto
```

Or install from a local folder while developing:

```bash
git clone <your-repo-url>
cd ai-komitto
npm install -g .
```

After installation, the package exposes this command:

```bash
komitto
```

## Requirements

- Node.js 18 or higher
- Git
- An API key for at least one supported provider

Node 18 is required because the package uses the built-in `fetch` API.

## Provider setup

### Gemini

```bash
export KOMITTO_PROVIDER="gemini"
export GEMINI_API_KEY="your_gemini_api_key"
export GEMINI_MODEL="gemini-flash-lite-latest"
```

Gemini is the default provider if `KOMITTO_PROVIDER` is not set.

### OpenAI

```bash
export KOMITTO_PROVIDER="openai"
export OPENAI_API_KEY="your_openai_api_key"
export OPENAI_MODEL="gpt-5.4-nano"
```

### Claude

```bash
export KOMITTO_PROVIDER="claude"
export ANTHROPIC_API_KEY="your_anthropic_api_key"
export CLAUDE_MODEL="claude-haiku-4-5"
```

## Language

The default commit message language is English.

```bash
komitto
```

Generate a Malay commit message:

```bash
komitto --language malay
```

Generate a Japanese commit message:

```bash
komitto --language japanese
```

Set a default language permanently:

```bash
export KOMITTO_LANGUAGE="english"
```

You can use any language name supported by your selected model, for example:

```bash
komitto --language english
komitto --language malay
komitto --language indonesian
komitto --language japanese
komitto --language chinese
```

## Permanent shell setup

For macOS or zsh:

```bash
nano ~/.zshrc
```

Add your preferred provider config:

```bash
export KOMITTO_PROVIDER="gemini"
export GEMINI_API_KEY="your_gemini_api_key"
export GEMINI_MODEL="gemini-flash-lite-latest"
export KOMITTO_LANGUAGE="english"
export KOMITTO_FORMAT="conventional"
export KOMITTO_CONTEXT="reference exact function names modified"
```

Reload your shell:

```bash
source ~/.zshrc
```

For bash:

```bash
nano ~/.bashrc
source ~/.bashrc
```

## Usage

Commit using your default provider:

```bash
komitto
```

Use a specific provider for one commit:

```bash
komitto --provider openai
```

Use a specific model for one commit:

```bash
komitto --provider gemini --model gemini-flash-lite-latest
```

Use a specific language for one commit:

```bash
komitto --language malay
```

Print the generated message without committing:

```bash
komitto --print
```

Do not run `git add` automatically:

```bash
komitto --no-add
```

Limit the diff size sent to the provider:

```bash
komitto --max-chars 12000
```

Set minimum word count for commit message:

```bash
komitto --min-words 8
```

Use a specific commit format:

```bash
komitto --format plain
komitto --format conventional
komitto --format gitmoji
komitto --format full
```

Possible gitmoji output:

```text
✨ add user avatar upload endpoint
```

Possible full output:

```text
feat: add user avatar upload endpoint

- add POST /api/avatar route with multer middleware
- validate file size and type before saving
- update user model with avatarUrl field
```

Add custom context to guide the commit message:

```bash
komitto --context "prioritize the performance effects of the updates"
komitto --context "reference the exact function names and file paths modified"
komitto --context "use gen alpha vibes terminology"
```

Show help:

```bash
komitto --help
```

## Editor aliases

You can create aliases in your terminal, editor, or IDE task runner.

### Replace your current commit shortcut

```bash
alias commit="komitto"
```

Then use:

```bash
commit
```

### Print-only alias

Useful when your editor only needs the generated message:

```bash
alias commitmsg="komitto --print"
```

Then:

```bash
commitmsg
```

### Provider-specific aliases

```bash
alias commitg="komitto --provider gemini"
alias commito="komitto --provider openai"
alias commitc="komitto --provider claude"
```

### Language-specific aliases

```bash
alias commitmy="komitto --language malay"
alias commitjp="komitto --language japanese"
```

## Configuration

Environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `KOMITTO_PROVIDER` | Default provider: `gemini`, `openai`, or `claude` | `gemini` |
| `KOMITTO_LANGUAGE` | Default commit message language | `english` |
| `GEMINI_API_KEY` | Gemini API key | none |
| `OPENAI_API_KEY` | OpenAI API key | none |
| `ANTHROPIC_API_KEY` | Anthropic API key | none |
| `GEMINI_MODEL` | Gemini model | `gemini-flash-lite-latest` |
| `OPENAI_MODEL` | OpenAI model | `gpt-5.4-nano` |
| `CLAUDE_MODEL` | Claude model | `claude-haiku-4-5` |
| `KOMITTO_MAX_CHARS` | Maximum diff characters sent to the provider | `18000` |
| `KOMITTO_MIN_WORDS` | Minimum words in the commit message | `12` |
| `KOMITTO_FORMAT` | Commit format: `plain`, `conventional`, `gitmoji`, `full` | `conventional` |
| `KOMITTO_CONTEXT` | Extra instructions for commit message generation | none |

CLI options override environment variables.

## CLI options

```bash
komitto [options]
```

| Option | Description |
| --- | --- |
| `-p, --provider <name>` | Provider: `gemini`, `openai`, or `claude` |
| `-m, --model <model>` | Override provider model |
| `-l, --language <name>` | Commit message language, default: `english` |
| `--no-add` | Do not run `git add` before generating the message |
| `--print` | Print the message only, do not commit |
| `--dry-run` | Same as `--print` |
| `--max-chars <number>` | Maximum diff characters sent to the provider |
| `-w, --min-words <n>` | Minimum words in the commit message, default: `12` |
| `-f, --format <type>` | Commit format: `plain`, `conventional`, `gitmoji`, `full` |
| `-c, --context <text>` | Extra instructions for the commit message |
| `-h, --help` | Show help |

## Default models

The package uses lightweight defaults intended for low-cost commit message generation:

```text
gemini: gemini-flash-lite-latest
openai: gpt-5.4-nano
claude: claude-haiku-4-5
```

The Gemini default intentionally uses the latest alias-style model name:

```text
gemini-flash-lite-latest
```

This reduces the chance of your CLI breaking when a fixed older Gemini model is deprecated or shut down.

Override the model if your account does not have access to a model or your provider changes the available model IDs:

```bash
komitto --provider openai --model gpt-5.4-mini
```

## How it works

By default, `komitto` runs:

```bash
git add <repo-root>
git diff --cached --stat
git diff --cached
git commit -m "<generated-message>"
```

The generated message is normalized before commit:

- first line only
- lowercase
- surrounding quotes removed
- trailing period removed

## Examples

English:

```bash
komitto --language english
```

Possible output:

```text
fix: update booking status translations
```

Malay:

```bash
komitto --language malay
```

Possible output:

```text
fix: kemas kini terjemahan status tempahan
```

Print only:

```bash
komitto --print --language english
```

Possible output:

```text
refactor: simplify provider selection logic
```

## License

MIT

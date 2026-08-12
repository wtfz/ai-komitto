import { cleanMessage } from './utils.js';

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function generateCommitMessageWithRetry({
  generate,
  format,
  maxTurns,
  retryDelayMs,
  sleep = wait,
  onRetry = () => {}
}) {
  for (let turn = 1; turn <= maxTurns; turn++) {
    const message = cleanMessage(await generate(), format);

    if (message) {
      return message;
    }

    if (turn < maxTurns) {
      const delayMs = retryDelayMs * turn;
      onRetry({ nextTurn: turn + 1, maxTurns, delayMs });
      await sleep(delayMs);
    }
  }

  throw new Error(`provider returned an empty commit message after ${maxTurns} turns`);
}

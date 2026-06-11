// Validates mention insertion (setLinkedInComposerSegments) against the live
// native composer WITHOUT posting: builds the draft, asserts LinkedIn created
// a real mention entity and enabled Post, then discards the draft.
//
// Prereq: node_modules present (esbuild bundles src/extension/linkedinComposer.ts
// so the validation exercises the shipped implementation, not a copy).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MENTION_NAME = 'scott hanselman';

const bundleDir = mkdtempSync(join(tmpdir(), 'lipf-mention-'));
const bundlePath = join(bundleDir, 'composer-bundle.js');

const mentionsBundlePath = join(bundleDir, 'mentions-bundle.js');

try {
  execFileSync(
    'node',
    [
      'node_modules/esbuild/bin/esbuild',
      'src/extension/linkedinComposer.ts',
      '--bundle',
      '--format=iife',
      '--global-name=__LIPF_COMPOSER',
      `--outfile=${bundlePath}`,
    ],
    { stdio: 'inherit' },
  );
  execFileSync(
    'node',
    [
      'node_modules/esbuild/bin/esbuild',
      'src/lib/mentions.ts',
      '--bundle',
      '--format=iife',
      '--global-name=__LIPF_MENTIONS',
      `--outfile=${mentionsBundlePath}`,
    ],
    { stdio: 'inherit' },
  );

  const bundle = readFileSync(bundlePath, 'utf8') + '\n' + readFileSync(mentionsBundlePath, 'utf8');

  const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const target = targets.find((candidate) => candidate.type === 'page' && candidate.url.includes('linkedin.com'));

  if (!target) {
    console.error('No LinkedIn page target found.');
    process.exit(1);
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let nextId = 0;

  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const message = { id: ++nextId, method, params };

      function handleMessage(event) {
        const data = JSON.parse(event.data);

        if (data.id !== message.id) {
          return;
        }

        socket.removeEventListener('message', handleMessage);
        data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
      }

      socket.addEventListener('message', handleMessage);
      socket.send(JSON.stringify(message));
    });
  }

  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });

    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }

    return result.result.value;
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  await call('Runtime.enable');
  await call('Page.enable');
  // An occluded window throttles in-page timers, so keep the page foregrounded
  // and "active", and poll readiness from this side rather than in the page.
  await call('Page.bringToFront').catch(() => {});
  await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
  // Bounce through the plain feed first: navigating to an identical
  // shareActive URL is a same-URL navigation that does not reopen the composer.
  await call('Page.navigate', { url: 'https://www.linkedin.com/feed/' });
  await sleep(4000);
  await call('Page.navigate', { url: 'https://www.linkedin.com/feed/?shareActive=true' });
  await sleep(5000);
  await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});

  await evaluate(`${bundle}; true`);

  let composerReady = false;

  for (let attempt = 0; attempt < 60 && !composerReady; attempt += 1) {
    composerReady = await evaluate(`Boolean(__LIPF_COMPOSER.findLinkedInComposer())`);

    if (!composerReady) {
      await sleep(500);
    }
  }

  console.log('composer ready:', composerReady);

  if (!composerReady) {
    console.error('FAIL: native composer not found.');
    process.exit(1);
  }

  const outcome = await evaluate(String.raw`(async () => {
    const composer = __LIPF_COMPOSER.findLinkedInComposer();
    // Drive the same pipeline the post bridge uses: exported text containing a
    // mention token, parsed into segments, written into the composer.
    const exportedText = 'Mention bridge test - @[${MENTION_NAME}] - automated draft, never posted.';
    const segments = __LIPF_MENTIONS.parseMentionSegments(exportedText);
    const result = await __LIPF_COMPOSER.setLinkedInComposerSegments(composer, segments);

    const entity = __LIPF_COMPOSER.findComposerMentionEntity(composer, 'Scott Hanselman');
    const entityInfo = entity
      ? {
          tag: entity.tagName,
          text: (entity.textContent ?? '').trim(),
          attributes: Object.fromEntries(Array.from(entity.attributes).map((attr) => [attr.name, attr.value.slice(0, 120)])),
        }
      : null;

    // Post button enabling proves LinkedIn accepted the content; we never click it.
    let postButtonEnabled = false;
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline && !postButtonEnabled) {
      postButtonEnabled = Boolean(__LIPF_COMPOSER.findLinkedInPostButton());
      if (!postButtonEnabled) await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      result,
      entityInfo,
      postButtonEnabled,
      composerHtml: composer.innerHTML.slice(0, 1200),
      composerText: (composer.textContent ?? '').slice(0, 300),
    };
  })()`);

  console.log(JSON.stringify(outcome, null, 2));

  // Discard the draft so nothing can be posted later. Close and discard run
  // every pass: the discard confirmation only appears after the close lands.
  const discarded = await evaluate(`(async () => {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      __LIPF_COMPOSER.closeNativeLinkedInComposer();
      __LIPF_COMPOSER.dismissNativeComposerDiscardConfirmation();
      if (!__LIPF_COMPOSER.findNativeComposerDialog()) return true;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return !__LIPF_COMPOSER.findNativeComposerDialog();
  })()`);
  console.log('draft discarded, composer closed:', discarded);

  const passed =
    outcome.result.inserted &&
    outcome.result.mentionsRequested === 1 &&
    outcome.result.mentionsApplied === 1 &&
    Boolean(outcome.entityInfo) &&
    outcome.postButtonEnabled &&
    discarded;

  console.log(passed ? 'VALIDATION PASSED' : 'VALIDATION FAILED');
  socket.close();
  process.exit(passed ? 0 : 1);
} finally {
  rmSync(bundleDir, { recursive: true, force: true });
}

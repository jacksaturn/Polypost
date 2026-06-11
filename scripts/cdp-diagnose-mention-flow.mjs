// Diagnostic: replicate setLinkedInComposerSegments step by step with
// snapshots (tray state, composer identity/HTML) to pin down why mention
// typing intermittently fails. Discards the draft at the end; never posts.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bundleDir = mkdtempSync(join(tmpdir(), 'lipf-diag-'));
const bundlePath = join(bundleDir, 'composer-bundle.js');

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

  const bundle = readFileSync(bundlePath, 'utf8');
  const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const target = targets.find((candidate) => candidate.type === 'page' && candidate.url.includes('linkedin.com'));
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
  await call('Page.bringToFront').catch(() => {});
  await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
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
    process.exit(1);
  }

  const outcome = await evaluate(String.raw`(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const snapshots = [];
    const composer = __LIPF_COMPOSER.findLinkedInComposer();
    window.__lipfDiagComposer = composer;

    const snap = (label) => {
      const current = __LIPF_COMPOSER.findLinkedInComposer();
      const trays = __LIPF_COMPOSER.queryAllDeep('[role="listbox"]').filter((tray) => {
        const rect = tray.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      snapshots.push({
        label,
        composerSame: current === window.__lipfDiagComposer,
        composerConnected: window.__lipfDiagComposer.isConnected,
        html: (current ?? window.__lipfDiagComposer).innerHTML.slice(0, 400),
        trayCount: trays.length,
        trayText: trays.map((tray) => (tray.textContent ?? '').replace(/\s+/g, ' ').slice(0, 120)).join(' | '),
      });
    };

    snap('start');

    composer.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('delete', false);
    snap('after-clear');

    composer.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, data: 'Mention diag - ', inputType: 'insertText' }));
    document.execCommand('insertText', false, 'Mention diag - ');
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: 'Mention diag - ', inputType: 'insertText' }));
    snap('after-bulk-text');

    for (const char of '@scott hanselman') {
      composer.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, data: char, inputType: 'insertText' }));
      document.execCommand('insertText', false, char);
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: char, inputType: 'insertText' }));
      await sleep(40);
    }

    snap('after-typing');
    await sleep(1000);
    snap('after-1s');
    await sleep(2000);
    snap('after-3s');

    const option = __LIPF_COMPOSER.findMentionTypeaheadOption('scott hanselman');
    snapshots.push({ label: 'option-search', found: Boolean(option) });

    if (option) {
      option.click();
      await sleep(1000);
      snap('after-option-click');
    }

    return snapshots;
  })()`);

  console.log(JSON.stringify(outcome, null, 2));

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
  console.log('draft discarded:', discarded);
  socket.close();
  process.exit(0);
} finally {
  rmSync(bundleDir, { recursive: true, force: true });
}

// Probe: open the native composer, type a draft character, click close, and
// dump the discard-confirmation dialog's controls (labels/classes) so the
// extension's discard matcher can be verified against current LinkedIn copy.
// Cleans up by clicking the discard control via startsWith matching.
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
await call('Page.navigate', { url: 'https://www.linkedin.com/feed/?shareActive=true' });
await sleep(6000);
await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});

const report = await evaluate(String.raw`(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function deepQuery(selector) {
    const roots = [document];
    for (let index = 0; index < roots.length; index += 1) {
      for (const host of roots[index].querySelectorAll('*')) {
        if (host.shadowRoot) roots.push(host.shadowRoot);
      }
    }
    return roots.flatMap((root) => Array.from(root.querySelectorAll(selector)));
  }

  const findComposer = () => deepQuery('.ql-editor[contenteditable="true"]').find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  let composer = findComposer();
  const composerDeadline = Date.now() + 15000;

  while (!composer && Date.now() < composerDeadline) {
    await sleep(500);
    composer = findComposer();
  }

  if (!composer) {
    return { error: 'no composer' };
  }

  composer.focus();
  document.execCommand('insertText', false, 'x');
  await sleep(500);

  // Scope the close click to the share composer dialog: the messaging overlay
  // also exposes a "Close your conversation..." control that must not match.
  const composerDialog = composer.closest('[role="dialog"]');
  const close = Array.from(composerDialog?.querySelectorAll('button, [role="button"]') ?? []).find((control) => {
    const label = ((control.getAttribute('aria-label') ?? '') + ' ' + (control.textContent ?? '')).trim().toLowerCase();
    return label.includes('dismiss') || label.includes('close');
  });
  close?.click();
  await sleep(1500);

  const confirmations = deepQuery('[role="dialog"], [role="alertdialog"]').filter((dialog) => {
    const rect = dialog.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && !String(dialog.className).includes('msg-') && !String(dialog.className).includes('vjs-');
  });

  const report = confirmations.map((dialog) => ({
    role: dialog.getAttribute('role'),
    cls: String(dialog.className).slice(0, 120),
    text: (dialog.textContent ?? '').replace(/\s+/g, ' ').slice(0, 160),
    controls: Array.from(dialog.querySelectorAll('button, [role="button"]')).map((control) => ({
      tag: control.tagName,
      aria: control.getAttribute('aria-label'),
      title: control.getAttribute('title'),
      text: (control.textContent ?? '').replace(/\s+/g, ' ').trim(),
      cls: String(control.className).slice(0, 100),
    })),
  }));

  // Cleanup: click whatever control starts with "discard".
  const discard = deepQuery('button, [role="button"]').find((control) => {
    const label = ((control.getAttribute('aria-label') ?? '') + ' ' + (control.textContent ?? '')).trim().toLowerCase();
    return label.startsWith('discard');
  });
  discard?.click();
  await sleep(800);

  return { report, discardClicked: Boolean(discard) };
})()`);

console.log(JSON.stringify(report, null, 2));
socket.close();
process.exit(0);

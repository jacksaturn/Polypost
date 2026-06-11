// Probe: does incremental typing of "@name" into the native composer trigger
// LinkedIn's mention typeahead, and what DOM does it render? Read-only — never
// clicks a suggestion and never posts; discards the draft at the end.
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

// Helper bundle: shadow-piercing queries + composer finder (mirrors
// linkedinComposer.ts) plus a MutationObserver that records nodes added while
// we type, so the typeahead surface reveals itself whatever its class names.
const setupOk = await evaluate(String.raw`(() => {
  function getSearchRoots(root) {
    const roots = [root];
    for (let index = 0; index < roots.length; index += 1) {
      for (const host of Array.from(roots[index].querySelectorAll('*'))) {
        if (host.shadowRoot) roots.push(host.shadowRoot);
      }
    }
    return roots;
  }
  function queryAllDeep(selector) {
    return getSearchRoots(document).flatMap((root) => Array.from(root.querySelectorAll(selector)));
  }
  function findComposer() {
    return queryAllDeep('.ql-editor[contenteditable="true"]').find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !element.closest('#linkedin-post-formatter-extension-root');
    }) ?? null;
  }
  window.__lipfProbe = { queryAllDeep, findComposer, added: [] };
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        window.__lipfProbe.added.push({
          tag: node.tagName,
          cls: String(node.className).slice(0, 120),
          role: node.getAttribute('role'),
          text: (node.textContent ?? '').replace(/\s+/g, ' ').slice(0, 80),
        });
      }
    }
  });
  for (const root of getSearchRoots(document)) {
    observer.observe(root === document ? document.documentElement : root, { childList: true, subtree: true });
  }
  return Boolean(findComposer());
})()`);

console.log('composer found:', setupOk);

if (!setupOk) {
  console.error('FAIL: native composer not present after shareActive navigation.');
  process.exit(1);
}

// Type "@scott hanselman" one character at a time, snapshotting candidate
// typeahead surfaces after each character.
const typing = await evaluate(String.raw`(async () => {
  const { findComposer, queryAllDeep } = window.__lipfProbe;
  const composer = findComposer();
  composer.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(composer);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const snapshots = [];
  const text = '@scott hanselman';

  for (const char of text) {
    composer.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, data: char, inputType: 'insertText' }));
    document.execCommand('insertText', false, char);
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: char, inputType: 'insertText' }));
    await sleep(350);

    const surfaces = queryAllDeep('[role="listbox"], [role="option"], [class*="typeahead"], [class*="mention"], [class*="suggestion"]')
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({
        tag: element.tagName,
        cls: String(element.className).slice(0, 120),
        role: element.getAttribute('role'),
        text: (element.textContent ?? '').replace(/\s+/g, ' ').slice(0, 100),
      }));
    snapshots.push({ typed: char, surfaceCount: surfaces.length, surfaces: surfaces.slice(0, 6) });
  }

  // Give the slowest typeahead fetch a moment, then take a deep final snapshot.
  await sleep(1500);
  const final = queryAllDeep('[role="listbox"], [class*="typeahead"], [class*="mention"]')
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((element) => ({
      tag: element.tagName,
      cls: String(element.className).slice(0, 150),
      role: element.getAttribute('role'),
      html: element.outerHTML.slice(0, 1500),
    }));

  return {
    composerHtml: findComposer().innerHTML.slice(0, 800),
    snapshots,
    final,
    addedDuringTyping: window.__lipfProbe.added.slice(-40),
  };
})()`);

console.log(JSON.stringify(typing, null, 2));

// Discard the draft so nothing lingers: close the composer and confirm discard.
const discarded = await evaluate(String.raw`(async () => {
  const { queryAllDeep } = window.__lipfProbe;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const label = (control) => [control.getAttribute('aria-label'), control.textContent].filter(Boolean).join(' ').trim().toLowerCase();
  const close = queryAllDeep('button, [role="button"]').find((control) => label(control).includes('dismiss') || label(control).includes('close'));
  close?.click();
  await sleep(800);
  const discard = queryAllDeep('button, [role="button"]').find((control) => /discard/.test(label(control)));
  discard?.click();
  await sleep(800);
  return { closed: Boolean(close), discardClicked: Boolean(discard) };
})()`);

console.log('cleanup:', JSON.stringify(discarded));
socket.close();
process.exit(0);

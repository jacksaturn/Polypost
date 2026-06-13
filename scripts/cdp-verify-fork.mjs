// One-off verification for OmniPost fork-on-edit. Connects to an Edge target on
// the dev server, types into the X platform card, and checks that the card
// forks (Customized badge) while the LinkedIn card keeps mirroring the master.
const endpoint = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9222/json/list';
const APP_URL = process.env.APP_URL ?? 'http://127.0.0.1:5173/';

const targets = await (await fetch(endpoint)).json();
const target = targets.find((c) => c.type === 'page' && c.url.startsWith(APP_URL.slice(0, 21)));

if (!target) {
  console.error('No app page target found. Open', APP_URL, 'in the debug browser.');
  process.exit(1);
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    function onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.id !== id) return;
      socket.removeEventListener('message', onMessage);
      data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
    }
    socket.addEventListener('message', onMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function evaluate(expression) {
  return call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((r) => r.result.value);
}

await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
await call('Runtime.enable');

// Snapshot LinkedIn card text before editing X.
const before = await evaluate(`(() => {
  const card = document.querySelector('[aria-label="LinkedIn preview"] .platform-card-text');
  return card ? card.textContent : null;
})()`);

// Click the X card's edit button, type, and report state.
const result = await evaluate(`(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const xCard = document.querySelector('[aria-label="X preview"]');
  if (!xCard) return { error: 'no X card' };
  const editBtn = xCard.querySelector('.platform-card-actions button');
  editBtn.click();
  await sleep(120);
  const pm = xCard.querySelector('.pane-editor-content');
  if (!pm) return { error: 'no pane editor mounted' };
  pm.focus();
  document.execCommand('insertText', false, ' EDITED-X');
  await sleep(120);
  const badge = xCard.querySelector('.platform-card-badge');
  const xCount = xCard.querySelector('.character-meter strong')?.textContent;
  return { forked: Boolean(badge), badgeText: badge?.textContent ?? null, xCount };
})()`);

// LinkedIn card after editing X — should be unchanged (still mirrors master).
const afterLinkedIn = await evaluate(`(() => {
  const card = document.querySelector('[aria-label="LinkedIn preview"] .platform-card-text');
  return card ? card.textContent : null;
})()`);

console.log(JSON.stringify({
  linkedInBefore: before,
  editResult: result,
  linkedInUnchanged: before === afterLinkedIn,
}, null, 2));

socket.close();

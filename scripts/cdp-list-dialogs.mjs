// Lists every [role="dialog"] (shadow-piercing) with geometry and a text
// snippet, to identify what is blocking composer cleanup.
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

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

const result = await call('Runtime.evaluate', {
  returnByValue: true,
  expression: String.raw`(() => {
    const roots = [document];
    for (let index = 0; index < roots.length; index += 1) {
      for (const host of roots[index].querySelectorAll('*')) {
        if (host.shadowRoot) roots.push(host.shadowRoot);
      }
    }
    return roots.flatMap((root) => Array.from(root.querySelectorAll('[role="dialog"]'))).map((dialog) => {
      const rect = dialog.getBoundingClientRect();
      return {
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        cls: String(dialog.className).slice(0, 120),
        aria: dialog.getAttribute('aria-label') ?? dialog.getAttribute('aria-labelledby'),
        text: (dialog.textContent ?? '').replace(/\s+/g, ' ').slice(0, 120),
      };
    });
  })()`,
});

console.log(JSON.stringify(result.result.value, null, 2));
socket.close();
process.exit(0);

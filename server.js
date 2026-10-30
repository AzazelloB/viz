import { createServer } from 'node:http';
import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';
import { dataDirectory, isDatasetFilename, listDatasets } from './lib/data.js';

const base = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const serverId = randomUUID();
const clients = new Set();
const files = {
  '/': 'public/index.html', '/app.js': 'public/app.js',
  '/style.css': 'public/style.css', '/tree-viewer.js': 'public/tree-viewer.js', '/icons.js': 'public/icons.js',
  '/layout.js': 'public/layout.js', '/lib/tree.js': 'lib/tree.js', '/schema.json': 'schema.json',
};
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
const send = (client, event) => client.write(`data: ${JSON.stringify(event)}\n\n`);
const broadcast = event => { for (const client of clients) send(client, event); };

// Agent saves and editor atomic-renames often emit several filesystem events.
let dataTimer, sourceTimer;
const sources = new Set();
const dataWatcher = watch(dataDirectory, (_event, name) => {
  if (name && !isDatasetFilename(name)) return;
  clearTimeout(dataTimer);
  dataTimer = setTimeout(() => broadcast({ type: 'data' }), 100);
});
const sourceWatcher = watch(join(base, 'public'), (_event, name) => {
  sources.add(name || '');
  clearTimeout(sourceTimer);
  sourceTimer = setTimeout(() => {
    broadcast({ type: [...sources].every(name => name.endsWith('.css')) ? 'styles' : 'reload' });
    sources.clear();
  }, 100);
});
dataWatcher.on('error', error => console.error('Data watcher:', error.message));
sourceWatcher.on('error', error => console.error('Source watcher:', error.message));

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end('This server only serves files. Write JSON datasets to data/.');
    }
    if (path === '/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
      clients.add(res);
      send(res, { type: 'connected', serverId });
      const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 25000);
      res.on('close', () => { clients.delete(res); clearInterval(heartbeat); });
      return;
    }
    if (path === '/data.json') {
      const catalog = JSON.stringify(await listDatasets());
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(req.method === 'HEAD' ? undefined : catalog);
    }
    const name = path.startsWith('/data/') ? path.slice('/data/'.length) : '';
    const file = files[path] || (isDatasetFilename(name) ? `data/${name}` : null);
    if (!file) { res.writeHead(404); return res.end('Not found'); }
    const contents = await readFile(join(base, file));
    res.writeHead(200, { 'Content-Type': `${types[extname(file)]}; charset=utf-8` });
    res.end(req.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    if (!res.headersSent) res.writeHead(error.code === 'ENOENT' ? 404 : 500);
    res.end(error.code === 'ENOENT' ? 'File not found' : 'Could not read file');
    if (error.code !== 'ENOENT') console.error(error);
  }
});

function shutdown() {
  dataWatcher.close(); sourceWatcher.close();
  clearTimeout(dataTimer); clearTimeout(sourceTimer);
  for (const client of clients) client.end();
  server.close();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
server.listen(port, host, () => console.log(`http://${host}:${port}`));

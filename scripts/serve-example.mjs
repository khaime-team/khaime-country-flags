/**
 * Static file server for the example. Serves the repo root so the page can
 * reach both examples/ and the flags/ directory the package publishes.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PORT = Number(process.env.PORT ?? 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  // Redirect rather than serving the page at /: the example's relative asset
  // and ../flags paths only resolve correctly from inside /examples/.
  if (url.pathname === '/') {
    res.writeHead(302, { location: '/examples/' }).end();
    return;
  }

  const path = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
  // normalize collapses any ../ before it can escape ROOT.
  const file = join(ROOT, normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, ''));

  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Example running at http://localhost:${PORT}`);
});

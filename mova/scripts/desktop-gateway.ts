import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import type { FastifyInstance, HTTPMethods } from 'fastify';
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
};
export function desktopGateway(app: FastifyInstance, rootPath: string) {
  const root = resolve(rootPath);
  return http.createServer(async (req, res) => {
    try {
      const port = (res.socket?.localAddress && res.socket.localPort) || 8080;
      const hosts = [`localhost:${port}`, `127.0.0.1:${port}`];
      if (!hosts.includes(req.headers.host ?? '')) {
        res.writeHead(403).end('Hôte non autorisé');
        return;
      }
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        if (req.headers.origin && !hosts.some((h) => req.headers.origin === `http://${h}`)) {
          res.writeHead(403).end('Origine non autorisée');
          return;
        }
        let size = 0;
        const chunks: Buffer[] = [];
        if (Number(req.headers['content-length'] ?? 0) > 32768) {
          res.writeHead(413, { Connection: 'close' }).end('Requête trop volumineuse');
          req.resume();
          return;
        }
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 32768) {
            res.writeHead(413).end('Requête trop volumineuse');
            return;
          }
          chunks.push(Buffer.from(chunk));
        }
        const result = await app.inject({
          method: req.method as HTTPMethods,
          url: url.pathname.slice(4) + url.search,
          headers: req.headers,
          payload: chunks.length ? Buffer.concat(chunks) : undefined,
        });
        res.writeHead(result.statusCode, result.headers);
        res.end(result.rawPayload);
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method ?? '')) {
        res.writeHead(405).end();
        return;
      }
      const decoded = decodeURIComponent(url.pathname);
      const file = resolve(root, '.' + decoded);
      if (
        (file !== root && !file.startsWith(root + sep)) ||
        decoded.split('/').some((s) => s.startsWith('.'))
      ) {
        res.writeHead(404).end();
        return;
      }
      let target = file;
      try {
        if (!(await stat(target)).isFile()) target = resolve(root, 'index.html');
      } catch {
        if (extname(file)) {
          res.writeHead(404).end();
          return;
        }
        target = resolve(root, 'index.html');
      }
      const body = await readFile(target);
      res.writeHead(200, {
        'Content-Type': mime[extname(target)] ?? 'application/octet-stream',
        'Content-Length': body.length,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': extname(target) === '.html' ? 'no-store' : 'public, max-age=3600',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end('Service local indisponible');
    }
  });
}

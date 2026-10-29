import { buildApp } from './server.js';
const app = await buildApp();
await app.listen({
  host: process.env.MOVA_DATABASE_ENGINE === 'embedded' ? '127.0.0.1' : '0.0.0.0',
  port: Number(process.env.PORT ?? 3001),
});

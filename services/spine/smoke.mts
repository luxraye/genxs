/**
 * Standalone spine service for tests and local development.
 *   node --experimental-strip-types services/spine/smoke.mts
 * The full gateway (server.ts) mounts the same router at /api/spine.
 */
import express from 'express';
import { spineRouter } from './server.ts';

const app = express();
app.use(express.json());
app.use('/api/spine', spineRouter);

const port = Number(process.env.SPINE_PORT || 3100);
app.listen(port, () => console.log(`[spine] listening on http://localhost:${port}/api/spine`));

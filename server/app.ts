import 'reflect-metadata';
import './configs/constants';
import { createApp } from './configs/application';
import { PORT } from './configs/constants';
import { ensureUser } from './app/modules/auth/application/auth.service';
import { ensureFts } from './app/shared/fts';

async function main(): Promise<void> {
  await ensureUser();
  await ensureFts();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[dulora] server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[dulora] failed to start:', err);
  process.exit(1);
});

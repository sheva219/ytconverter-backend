import cron from 'node-cron';
import { unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';
import logger from './logger';

const DOWNLOADS_DIR = join(process.cwd(), 'downloads');
const MAX_AGE = 3600000; // 1 hour in milliseconds

async function cleanup() {
  try {
    const files = await readdir(DOWNLOADS_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = join(DOWNLOADS_DIR, file);
      const fileStat = await stat(filePath);

      if (now - fileStat.mtimeMs > MAX_AGE) {
        await unlink(filePath);
        logger.info(`Cleaned up file: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Cleanup error:', error);
  }
}

export function setupCleanup() {
  // Run cleanup every hour
  cron.schedule('0 * * * *', cleanup);
  
  // Run initial cleanup
  cleanup();
}
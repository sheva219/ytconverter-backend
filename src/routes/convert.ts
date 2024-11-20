import { Router } from 'express';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import logger from '../utils/logger';

const router = Router();
const DOWNLOADS_DIR = join(process.cwd(), 'downloads');

// Ensure downloads directory exists
mkdir(DOWNLOADS_DIR, { recursive: true }).catch(console.error);

router.post('/', async (req, res) => {
  try {
    const { url, format } = req.body;

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const videoInfo = await ytdl.getInfo(url);
    const videoId = videoInfo.videoDetails.videoId;
    const title = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
    const outputFileName = `${title}_${randomBytes(4).toString('hex')}.${format}`;
    const outputPath = join(DOWNLOADS_DIR, outputFileName);

    if (format === 'mp3') {
      const stream = ytdl(url, { quality: 'highestaudio' });
      
      await new Promise((resolve, reject) => {
        ffmpeg(stream)
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });
    } else {
      const stream = ytdl(url, { quality: 'highest' });
      const writeStream = require('fs').createWriteStream(outputPath);
      stream.pipe(writeStream);
      
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    }

    logger.info(`Successfully converted video: ${videoId} to ${format}`);
    res.json({
      downloadUrl: `/downloads/${outputFileName}`,
      fileName: outputFileName
    });
  } catch (error) {
    logger.error('Conversion error:', error);
    res.status(500).json({ error: 'Failed to convert video' });
  }
});

export { router as convertRouter };
import multer from 'multer';
import { supabaseAdmin } from '../../config/supabaseClient.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

// Set up Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export const uploadMediaMiddleware = upload.single('file');

const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

const extractWaveform = (filePath) => {
  return new Promise((resolve, reject) => {
    let rawPcm = Buffer.alloc(0);
    
    ffmpeg(filePath)
      .audioChannels(1)
      .audioFrequency(44100)
      .format('s16le')
      .on('error', reject)
      .on('end', () => {
        // We have raw PCM 16-bit little endian
        // We need 40 points
        const numPoints = 40;
        const totalSamples = Math.floor(rawPcm.length / 2);
        const samplesPerBucket = Math.floor(totalSamples / numPoints);
        const peaks = [];
        
        let maxPeak = 0;
        
        for (let i = 0; i < numPoints; i++) {
          let bucketMax = 0;
          for (let j = 0; j < samplesPerBucket; j++) {
            const offset = (i * samplesPerBucket + j) * 2;
            if (offset < rawPcm.length - 1) {
              const sample = Math.abs(rawPcm.readInt16LE(offset));
              if (sample > bucketMax) bucketMax = sample;
            }
          }
          peaks.push(bucketMax);
          if (bucketMax > maxPeak) maxPeak = bucketMax;
        }
        
        // Normalize 0..1
        const normalized = peaks.map(p => maxPeak === 0 ? 0 : Number((p / maxPeak).toFixed(3)));
        resolve(normalized);
      })
      .pipe()
      .on('data', chunk => {
        rawPcm = Buffer.concat([rawPcm, chunk]);
      });
  });
};

export const uploadMedia = [
  uploadMediaMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No file uploaded');

    const file = req.file;
    const type = req.body.type || 'document'; // image, video, voice, document
    let buffer = file.buffer;
    let mimeType = file.mimetype;
    let metadata = {};

    const ext = path.extname(file.originalname) || '';
    const filename = `${req.user.id}/${uuidv4()}${ext}`;

    // Process based on type
    if (type === 'image') {
      const img = sharp(buffer);
      const meta = await img.metadata();
      metadata.width = meta.width;
      metadata.height = meta.height;
      // Optionally compress
      buffer = await img.jpeg({ quality: 80 }).toBuffer();
      mimeType = 'image/jpeg';
    } 
    else if (type === 'video' || type === 'voice') {
      // Need temp file for ffmpeg
      const tempPath = path.join(os.tmpdir(), `${uuidv4()}${ext}`);
      fs.writeFileSync(tempPath, buffer);

      try {
        metadata.duration = await getDuration(tempPath);

        if (type === 'voice') {
          metadata.waveform = await extractWaveform(tempPath);
        }
      } catch (err) {
        console.error('FFmpeg error:', err);
      } finally {
        fs.unlinkSync(tempPath);
      }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('chat-media')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) throw new ApiError(500, error.message);

    // Get signed URL (valid for 1 year)
    const { data: signedData } = await supabaseAdmin.storage
      .from('chat-media')
      .createSignedUrl(filename, 60 * 60 * 24 * 365);

    res.json({
      url: data.path, // relative path
      signedUrl: signedData?.signedUrl,
      type,
      size: buffer.length,
      ...metadata
    });
  })
];

import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

@Controller('uploads')
export class UploadsController {
  
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      // Only allow image files
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Return the URL where the file can be accessed
    return {
      url: `http://localhost:3001/uploads/${file.filename}`
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('video')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `video-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(mp4|webm|mov|avi)$/i)) {
        return cb(new BadRequestException('Only video files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  }))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const inputPath = file.path;
    const outputFilename = `compressed-${file.filename}.mp4`;
    const outputPath = path.join('./uploads', outputFilename);
    const thumbnailFilename = `thumb-${file.filename}.jpg`;

    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegStatic = require('ffmpeg-static');
    const ffprobeStatic = require('ffprobe-static');
    const pathModule = require('path');

    ffmpeg.setFfmpegPath(ffmpegStatic);
    ffmpeg.setFfprobePath(ffprobeStatic.path);

    return new Promise((resolve, reject) => {
      // Step 1: Probe the video to get width and height
      ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
        if (err) {
          console.error("FFProbe Error:", err);
          return reject(new BadRequestException('Failed to process video'));
        }

        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        let width = videoStream?.width;
        let height = videoStream?.height;
        const duration = metadata.format.duration;

        // Step 2: Extract a thumbnail at 1 second (or 0s if short video)
        const ts = duration && duration > 1 ? '1' : '0';
        
        ffmpeg(inputPath)
          .on('end', () => {
            // Step 3: Compress video to max 720p
            ffmpeg(inputPath)
              .outputOptions([
                "-vf scale='min(720,iw)':-2", // scale keeping aspect ratio, max 720 width
                '-crf 28', // compression quality
                '-preset fast'
              ])
              .save(outputPath)
              .on('end', () => {
                 // Remove original raw video to save space
                 try { fs.unlinkSync(inputPath); } catch (e) {}

                 resolve({
                   url: `http://localhost:3001/uploads/${outputFilename}`,
                   thumbnailUrl: `http://localhost:3001/uploads/${thumbnailFilename}`,
                   width,
                   height,
                   duration: Math.round(duration || 0),
                   mediaType: 'VIDEO'
                 });
              })
              .on('error', (err: any) => {
                 console.error('Compression error:', err);
                 reject(new BadRequestException('Video compression failed'));
              });
          })
          .on('error', (err: any) => {
             console.error('Thumbnail error:', err);
             reject(new BadRequestException('Thumbnail generation failed'));
          })
          .screenshots({
            timestamps: [ts],
            filename: thumbnailFilename,
            folder: './uploads',
            size: '?x720'
          });
      });
    });
  }
}

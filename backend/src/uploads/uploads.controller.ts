import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
  
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || 'https://07cb382365e6a2e28addc63ed3de3f13.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '5fcd61f61c1fbe8b4c14011b3810ff66',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '32ae8e997be8cf2af3bd4e40819d8ef9c413368bb28add4c9c7ee07f2d1ee6f7',
      },
    });
  }
  
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
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'intasela',
        Key: file.filename,
        Body: fileBuffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      // Remove temporary file
      try { fs.unlinkSync(file.path); } catch (e) {}

      const baseUrl = process.env.R2_PUBLIC_URL || 'https://media.naijanews360.com.ng';
      return {
        url: `${baseUrl}/${file.filename}`
      };
    } catch (err) {
      console.error('R2 Upload Error:', err);
      // Fallback or just throw error
      throw new BadRequestException('Failed to upload image to cloud storage');
    }
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
  async uploadVideo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
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
              .on('end', async () => {
                 try {
                   // Read the compressed video and thumbnail from disk
                   const videoBuffer = fs.readFileSync(outputPath);
                   const thumbPath = path.join('./uploads', thumbnailFilename);
                   const thumbBuffer = fs.readFileSync(thumbPath);

                   const videoCommand = new PutObjectCommand({
                     Bucket: process.env.R2_BUCKET_NAME || 'intasela',
                     Key: outputFilename,
                     Body: videoBuffer,
                     ContentType: 'video/mp4',
                   });

                   const thumbCommand = new PutObjectCommand({
                     Bucket: process.env.R2_BUCKET_NAME || 'intasela',
                     Key: thumbnailFilename,
                     Body: thumbBuffer,
                     ContentType: 'image/jpeg',
                   });

                   await Promise.all([
                     this.s3Client.send(videoCommand),
                     this.s3Client.send(thumbCommand)
                   ]);

                   // Clean up temporary local files
                   try { fs.unlinkSync(inputPath); } catch (e) {}
                   try { fs.unlinkSync(outputPath); } catch (e) {}
                   try { fs.unlinkSync(thumbPath); } catch (e) {}

                   const baseUrl = process.env.R2_PUBLIC_URL || 'https://media.naijanews360.com.ng';
                   resolve({
                     url: `${baseUrl}/${outputFilename}`,
                     thumbnailUrl: `${baseUrl}/${thumbnailFilename}`,
                     width,
                     height,
                     duration: Math.round(duration || 0),
                     mediaType: 'VIDEO'
                   });
                 } catch (err) {
                   console.error('R2 Video Upload Error:', err);
                   reject(new BadRequestException('Failed to upload video to cloud storage'));
                 }
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

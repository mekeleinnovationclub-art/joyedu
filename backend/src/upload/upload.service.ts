import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // For now, return a placeholder URL
    // In production, this would upload to S3, Cloudinary, or similar
    const baseUrl = this.configService.get('API_URL') || 'http://localhost:4000';
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return { url: fileUrl };
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    // Validate image file
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    return this.uploadFile(file);
  }

  async uploadVideo(file: Express.Multer.File): Promise<{ url: string }> {
    // Validate video file
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('File must be a video');
    }

    return this.uploadFile(file);
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ url: string }> {
    // Validate document file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File must be a PDF or Word document');
    }

    return this.uploadFile(file);
  }

  getUploadUrl(filename: string): string {
    const baseUrl = this.configService.get('API_URL') || 'http://localhost:4000';
    return `${baseUrl}/uploads/${filename}`;
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

interface UploadResult {
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
  name: string;
  subPath: string;
}

@Injectable()
export class GcsService {
  private storage = new Storage();
  private bucketName: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('GCP_STORAGE_BUCKET_NAME');
  }

  async uploadFile(
    file: Express.Multer.File,
    path: string | undefined,
  ): Promise<UploadResult> {
    if (!this.bucketName) {
      throw new BadRequestException(
        'GCP_STORAGE_BUCKET_NAME is not configured',
      );
    }

    const bucket = this.storage.bucket(this.bucketName);
    let name = `${Date.now()}-${file.originalname || 'unnamed.jpg'}`;
    name = name.replace(/\s+/g, '_');
    const subPath = `${path}/${name}`;
    const fileRef = bucket.file(subPath);

    const stream = fileRef.createWriteStream({
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    return new Promise<UploadResult>((resolve, reject) => {
      stream.on('error', reject);

      stream.on('finish', () => {
        // No per-object ACL here: the bucket must grant allUsers
        // roles/storage.objectViewer (Uniform Bucket-Level Access) for this
        // public URL to be readable. makePublic() throws on a UBLA bucket.
        const publicUrl = `${this.configService.get<string>('GCP_STORAGE_PUBLIC_URL')}/${this.bucketName}/${subPath}`;
        resolve({
          url: publicUrl,
          mimeType: file.mimetype,
          size: file.size,
          originalName: file.originalname,
          name,
          subPath,
        });
      });

      stream.end(file.buffer);
    });
  }

  async deleteFile(subPath: string) {
    if (!this.bucketName) {
      throw new BadRequestException(
        'GCP_STORAGE_BUCKET_NAME is not configured',
      );
    }

    const bucket = this.storage.bucket(this.bucketName);
    await bucket.file(subPath).delete();
  }
}

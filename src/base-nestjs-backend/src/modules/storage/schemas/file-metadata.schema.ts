import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';

@Schema()
export class FileMetadata {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  subPath: string;

  @Prop()
  blog: string; // link to Blog ID if applicable
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);
FileMetadataSchema.add(BaseSchema);

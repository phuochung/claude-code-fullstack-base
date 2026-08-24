import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../shared/base/base.schema';
import mongoose, { Types } from 'mongoose';
import { BlogStatusEnum } from '../../blog/enums/blog-status.enum';
@Schema()
export class BlogSection {
  @Prop({ required: true })
  order: number;

  @Prop({ required: true, enum: ['html', 'image'] })
  type: string;

  @Prop()
  content?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileMetadata',
    required: false,
  })
  fileMetadata?: Types.ObjectId;

  @Prop()
  caption?: string;
}

export const BlogSectionSchema = SchemaFactory.createForClass(BlogSection);

@Schema()
export class Blog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // website friendly url
  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  excerpt: string;

  @Prop({ default: 'vi' })
  language: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileMetadata',
    required: false,
  })
  bannerFileMetadata: Types.ObjectId;

  @Prop({ type: [BlogSectionSchema], default: [] })
  sections: BlogSection[];

  @Prop({ default: BlogStatusEnum.DRAFT, type: Number })
  status: number;

  @Prop()
  publishedAt: Date;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  publishBy: Types.ObjectId;

  @Prop()
  tmpHideAt: Date;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  tmpHideBy: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tag' }] })
  tags: Types.ObjectId[];

  @Prop({ default: 0 })
  viewCount: number;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.add(BaseSchema);
BlogSchema.index({ tags: 1 });
BlogSchema.index({ category: 1 });
// Serves every slug lookup in the codebase -- all of them filter on
// `deleted: false`, which matches this partial index. Do not add a plain
// `index({ slug: 1 })` alongside it: same key pattern with different options
// makes MongoDB reject the second index with IndexOptionsConflict.
BlogSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted: false } },
);
BlogSchema.index({ language: 1 });

import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray, IsIn, IsDateString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsNumber()
  quotedPostId?: number;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsIn(['IMAGE', 'VIDEO'])
  mediaType?: string;

  @IsOptional()
  @IsNumber()
  videoWidth?: number;

  @IsOptional()
  @IsNumber()
  videoHeight?: number;

  @IsOptional()
  @IsNumber()
  videoDuration?: number;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsIn(['PUBLISHED', 'DRAFT'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pollOptions?: string[];

  @IsOptional()
  @IsNumber()
  pollDurationDays?: number;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsNumber()
  draftId?: number;
}

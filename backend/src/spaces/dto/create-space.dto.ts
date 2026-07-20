import { IsNotEmpty, IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class CreateSpaceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  type?: string;

  @IsOptional()
  @IsIn(['NONE', 'ALL_POSTS', 'FIRST_POST_ONLY'])
  postApprovalMode?: string;
}

import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

export class UpdateMemberStatusDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

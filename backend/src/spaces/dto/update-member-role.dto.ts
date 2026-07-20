import { IsNotEmpty, IsString, IsOptional, IsArray, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsIn(['MEMBER', 'MODERATOR', 'ADMIN'])
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

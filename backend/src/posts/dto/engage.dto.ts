import { IsNotEmpty, IsIn } from 'class-validator';

export class EngageDto {
  @IsNotEmpty()
  @IsIn(['LIKE', 'RESELA', 'BOOKMARK'])
  type: string;
}

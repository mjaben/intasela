import { IsNotEmpty, IsIn } from 'class-validator';

export class EngageDto {
  @IsNotEmpty()
  @IsIn(['LIKE', 'RESELA', 'BOOKMARK', 'INTERESTED', 'NOT_INTERESTED'])
  type: string;
}

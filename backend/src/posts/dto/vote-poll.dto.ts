import { IsNotEmpty, IsNumber } from 'class-validator';

export class VotePollDto {
  @IsNotEmpty()
  @IsNumber()
  optionId: number;
}

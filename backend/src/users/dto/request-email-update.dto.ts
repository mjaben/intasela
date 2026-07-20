import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailUpdateDto {
  @IsNotEmpty()
  @IsEmail()
  newEmail: string;
}

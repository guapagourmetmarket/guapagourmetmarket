import { IsString, MinLength } from 'class-validator';

export class ValidarCuponDto {
  @IsString()
  @MinLength(1)
  codigo!: string;
}

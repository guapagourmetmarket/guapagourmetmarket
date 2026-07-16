import { IsString, MinLength } from 'class-validator';

export class AbrirCuentaDto {
  @IsString()
  @MinLength(2)
  nombre!: string;
}

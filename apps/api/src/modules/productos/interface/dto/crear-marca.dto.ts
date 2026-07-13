import { IsString, MinLength } from 'class-validator';

export class CrearMarcaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

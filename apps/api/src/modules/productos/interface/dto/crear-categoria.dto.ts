import { IsString, MinLength } from 'class-validator';

export class CrearCategoriaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

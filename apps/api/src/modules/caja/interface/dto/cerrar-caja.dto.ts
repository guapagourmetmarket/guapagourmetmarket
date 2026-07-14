import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CerrarCajaDto {
  @IsNumber()
  @Min(0)
  efectivoContado!: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

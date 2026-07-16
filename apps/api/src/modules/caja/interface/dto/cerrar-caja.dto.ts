import { ArrayMaxSize, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DenominacionDto } from './denominacion.dto';

export class CerrarCajaDto {
  @IsNumber()
  @Min(0)
  efectivoContado!: number;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DenominacionDto)
  denominaciones?: DenominacionDto[];
}

import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { Iva } from '../../domain/producto.entity';
import { InfoNutricionalDto } from './info-nutricional.dto';

export class CrearProductoDto {
  @IsString()
  @MinLength(1)
  codigoInterno!: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  precioCompra!: number;

  @IsNumber()
  @Min(0)
  precioVenta!: number;

  @IsIn([0, 5, 19])
  iva!: Iva;

  @IsUUID()
  categoriaId!: string;

  @IsOptional()
  @IsUUID()
  marcaId?: string;

  @IsString()
  @MinLength(1)
  unidadMedida!: string;

  @IsInt()
  @Min(0)
  existencias!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsString()
  ingredientes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InfoNutricionalDto)
  infoNutricional?: InfoNutricionalDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  peso?: number;

  @IsOptional()
  @IsString()
  pesoUnidad?: string;
}

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

export class ActualizarProductoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  codigoInterno?: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioCompra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVenta?: number;

  @IsOptional()
  @IsIn([0, 5, 19])
  iva?: Iva;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  marcaId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unidadMedida?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  existencias?: number;

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

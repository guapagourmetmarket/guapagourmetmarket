import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
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

  // Mínimo 0.01 (no 0): sin un costo real no se puede calcular la
  // rentabilidad del producto en los reportes de margen.
  @IsNumber()
  @Min(0.01)
  precioCompra!: number;

  @IsNumber()
  @Min(0.01)
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

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  existencias!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean()
  vendePorPeso?: boolean;

  // null = sin oferta activa. @IsOptional trata null y undefined igual, así
  // que esto también sirve para quitar un descuento ya activo.
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  descuentoPorcentaje?: number | null;

  // Promoción "lleva N, paga M" (ej. 3x2), excluyente con descuentoPorcentaje
  // (el backend rechaza si llegan los dos a la vez). null = sin promoción.
  @IsOptional()
  @IsInt()
  @Min(2)
  promocionN?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  promocionM?: number | null;

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

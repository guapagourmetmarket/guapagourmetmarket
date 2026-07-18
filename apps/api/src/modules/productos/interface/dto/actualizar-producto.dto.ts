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

  // Mínimo 0.01 (no 0): sin un costo real no se puede calcular la
  // rentabilidad del producto en los reportes de margen.
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  precioCompra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
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
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  existencias?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean()
  vendePorPeso?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  descuentoPorcentaje?: number | null;

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

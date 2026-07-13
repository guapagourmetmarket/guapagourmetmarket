import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import type { MetodoPagoCompra } from '../../domain/compra.entity';

export class CompraItemDto {
  @IsUUID()
  productoId!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsNumber()
  @Min(0)
  costoUnitario!: number;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

export class RegistrarCompraDto {
  @IsUUID()
  proveedorId!: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  numeroFacturaProveedor?: string;

  @IsIn(['contado', 'transferencia', 'credito'])
  metodoPago!: MetodoPagoCompra;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimientoPago?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  items!: CompraItemDto[];
}

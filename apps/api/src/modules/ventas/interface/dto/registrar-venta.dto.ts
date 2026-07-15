import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { MetodoPago } from '../../domain/venta.entity';

const METODOS_PAGO: MetodoPago[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'nequi',
  'daviplata',
  'mixto',
];

export class VentaItemDto {
  @IsUUID()
  productoId!: string;

  // Decimal para poder vender por peso (ej. 0.350 kg); en productos que se
  // venden por unidad, el front sigue mandando enteros.
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidad!: number;
}

export class RegistrarVentaDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  fecha?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsString()
  clienteNombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorLibre?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @IsIn(METODOS_PAGO)
  metodoPago!: MetodoPago;

  @IsOptional()
  @IsBoolean()
  fiado?: boolean;

  @IsOptional()
  @IsISO8601({ strict: true })
  fechaVencimientoPago?: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items!: VentaItemDto[];
}

import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { MetodoPagoGasto } from '../../domain/gasto.entity';

export class CrearGastoDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsString()
  @MinLength(2)
  categoria!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(1)
  valor!: number;

  @IsIn(['efectivo', 'transferencia', 'tarjeta'])
  metodoPago!: MetodoPagoGasto;
}
